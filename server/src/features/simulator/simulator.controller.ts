import type {
  SimulationResponse,
  SimulationResult,
  SimulationBreakdown,
  CombinedImpact,
  SimulationAction,
} from '@carbonwise/shared';
import {
  getEmissionFactor,
  EQUIVALENTS,
  SIMULATION_TEMPLATES,
} from '@carbonwise/shared';
import type { Request, Response } from 'express';
import { z } from 'zod';

import { query } from '../../config/database';
import { asyncHandler } from '../../middleware/error-handler.middleware';
import { sendSuccess } from '../../utils/response';
import * as carbonRepo from '../carbon/carbon.repository';

/**
 * Smart Action Simulator — lets users test "what if" scenarios
 * against their actual carbon data and see projected impact instantly.
 */

// ---- Schemas ----

const simulationSchema = z.object({
  scenarios: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      actions: z.array(
        z.object({
          type: z.enum(['switch_transport', 'reduce_usage', 'change_diet', 'reduce_consumption', 'switch_energy_source']),
          category: z.string(),
          subcategory: z.string(),
          description: z.string(),
          params: z.object({
            newMode: z.string().optional(),
            reductionPercent: z.number().min(0).max(100).optional(),
            daysPerWeek: z.number().min(0).max(7).optional(),
            newDietType: z.string().optional(),
            newAmount: z.number().optional(),
            unit: z.string().optional(),
          }),
        }),
      ).min(1),
    }),
  ).min(1).max(5),
});

function simulateAction(
  action: SimulationAction,
  currentWeeklyKg: number,
): SimulationBreakdown {
  let afterKg = currentWeeklyKg;

  switch (action.type) {
    case 'switch_transport': {
      const newFactor = action.params.newMode
        ? getEmissionFactor('transportation', action.params.newMode)
        : null;
      const oldFactor = getEmissionFactor(action.category, action.subcategory);

      if (newFactor && oldFactor && action.params.daysPerWeek) {
        const daysReduced = action.params.daysPerWeek;
        const fractionReduced = daysReduced / 5; // assume 5-day commute
        const savingsPerDay = (oldFactor.factor - newFactor.factor) * 20; // assume 20km commute
        afterKg = Math.max(0, currentWeeklyKg - savingsPerDay * fractionReduced * 5);
      }
      break;
    }
    case 'reduce_usage': {
      const reduction = (action.params.reductionPercent ?? 0) / 100;
      afterKg = currentWeeklyKg * (1 - reduction);
      break;
    }
    case 'change_diet': {
      const newDiet = action.params.newDietType;
      const newFactor = newDiet ? getEmissionFactor('food', newDiet) : null;
      const oldFactor = getEmissionFactor(action.category, action.subcategory);

      if (newFactor && oldFactor) {
        const ratio = newFactor.factor / oldFactor.factor;
        afterKg = currentWeeklyKg * ratio;
      }
      break;
    }
    case 'reduce_consumption': {
      const reduction = (action.params.reductionPercent ?? 0) / 100;
      afterKg = currentWeeklyKg * (1 - reduction);
      break;
    }
    case 'switch_energy_source': {
      afterKg = currentWeeklyKg * 0.3; // Renewable = ~70% reduction
      break;
    }
  }

  return {
    action: action.description,
    beforeKg: Math.round(currentWeeklyKg * 100) / 100,
    afterKg: Math.round(Math.max(0, afterKg) * 100) / 100,
    savedKg: Math.round(Math.max(0, currentWeeklyKg - afterKg) * 100) / 100,
  };
}

// ---- Controllers ----

export const simulate = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { scenarios } = req.body as z.infer<typeof simulationSchema>;

  // Get user's current weekly emissions by category
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const today = new Date();

  const categorySummary = await carbonRepo.getCategorySummary(
    userId,
    fourWeeksAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0],
  );

  const weeklyByCategory: Record<string, number> = {};
  for (const c of categorySummary) {
    weeklyByCategory[c.category] = parseFloat(String(c.total_kg)) / 4;
  }

  const totalCurrentWeekly = Object.values(weeklyByCategory).reduce((s, v) => s + v, 0);

  const results: SimulationResult[] = scenarios.map((scenario) => {
    let scenarioReduction = 0;
    const breakdowns: SimulationBreakdown[] = [];

    for (const action of scenario.actions) {
      const categoryWeekly = weeklyByCategory[action.category] ?? 0;
      const breakdown = simulateAction(action, categoryWeekly);
      breakdowns.push(breakdown);
      scenarioReduction += breakdown.savedKg;
    }

    const projectedTotal = Math.max(0, totalCurrentWeekly - scenarioReduction);

    return {
      scenarioId: scenario.id,
      scenarioName: scenario.name,
      currentEmissionsKg: Math.round(totalCurrentWeekly * 100) / 100,
      projectedEmissionsKg: Math.round(projectedTotal * 100) / 100,
      reductionKg: Math.round(scenarioReduction * 100) / 100,
      reductionPercent: totalCurrentWeekly > 0
        ? Math.round((scenarioReduction / totalCurrentWeekly) * 10000) / 100
        : 0,
      breakdown: breakdowns,
      feasibility: {
        overall: Math.min(10, Math.max(1, 10 - scenarioReduction / totalCurrentWeekly * 5)),
        factors: {
          costImpact: scenarioReduction > totalCurrentWeekly * 0.3 ? 'savings' as const : 'neutral' as const,
          effortLevel: scenarioReduction > totalCurrentWeekly * 0.5 ? 'high' as const : scenarioReduction > totalCurrentWeekly * 0.2 ? 'medium' as const : 'low' as const,
          timeToAdopt: scenarioReduction > totalCurrentWeekly * 0.3 ? '1 month' : '1 week',
          sustainabilityIndex: Math.round(Math.min(10, 5 + (1 - scenarioReduction / totalCurrentWeekly) * 5)),
        },
      },
    };
  });

  const totalReduction = results.reduce((s, r) => s + r.reductionKg, 0);

  const combinedImpact: CombinedImpact = {
    totalReductionKg: Math.round(totalReduction * 100) / 100,
    totalReductionPercent: totalCurrentWeekly > 0
      ? Math.round((totalReduction / totalCurrentWeekly) * 10000) / 100
      : 0,
    annualizedSavingsKg: Math.round(totalReduction * 52 * 100) / 100,
    equivalentTreesPlanted: Math.round((totalReduction * 52) / EQUIVALENTS.KG_PER_TREE_PER_YEAR * 10) / 10,
    equivalentCarMilesAvoided: Math.round((totalReduction * 52) / EQUIVALENTS.KG_PER_CAR_MILE),
  };

  const response: SimulationResponse = {
    scenarios: results,
    combinedImpact,
    generatedAt: new Date().toISOString(),
  };

  // Store in history
  await query(
    'INSERT INTO simulation_history (user_id, scenarios, results) VALUES ($1, $2, $3)',
    [userId, JSON.stringify(scenarios), JSON.stringify(response)],
  );

  sendSuccess(res, response);
});

export const templates = asyncHandler((_req: Request, res: Response): Promise<void> => {
  sendSuccess(res, { templates: SIMULATION_TEMPLATES });
  return Promise.resolve();
});

export const history = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  const rows = await query<{ id: string; scenarios: unknown; results: unknown; created_at: Date }>(
    'SELECT * FROM simulation_history WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit],
  );

  sendSuccess(res, {
    simulations: rows.map((r) => ({
      id: r.id,
      scenarios: r.scenarios,
      results: r.results,
      createdAt: r.created_at.toISOString(),
    })),
  });
});

export { simulationSchema };
