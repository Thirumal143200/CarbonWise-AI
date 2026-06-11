import type {
  SustainabilityTwin,
  BehaviorProfile,
  GapAnalysis,
  ProjectedSavings,
} from '@carbonwise/shared';
import {
  EQUIVALENTS,
  TRANSPORT_FACTORS,
  HOME_FACTORS,
  FOOD_FACTORS,
  LIFESTYLE_FACTORS,
} from '@carbonwise/shared';
import type { Request, Response } from 'express';

import { asyncHandler } from '../../middleware/error-handler.middleware';
import { sendSuccess } from '../../utils/response';
import * as carbonRepo from '../carbon/carbon.repository';

/**
 * Sustainability Twin — creates a virtual ideal profile
 * and compares it against the user's actual behavior.
 */

async function buildCurrentProfile(userId: string): Promise<BehaviorProfile> {
  const fourWeeksAgo = new Date();
  fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
  const today = new Date();

  const categorySummary = await carbonRepo.getCategorySummary(
    userId,
    fourWeeksAgo.toISOString().split('T')[0],
    today.toISOString().split('T')[0],
  );

  const catMap: Record<string, number> = {};
  for (const c of categorySummary) {
    catMap[c.category] = parseFloat(String(c.total_kg));
  }

  const weeklyDivider = 4; // 4 weeks of data

  return {
    transportMode: {
      primaryMode: 'car',
      weeklyKm: 0,
      emissionsKgPerWeek: (catMap['transportation'] ?? 0) / weeklyDivider,
      breakdown: [],
    },
    energyUsage: {
      monthlyKwh: 0,
      gasUsageLiters: 0,
      waterUsageLiters: 0,
      emissionsKgPerWeek: (catMap['home'] ?? 0) / weeklyDivider,
    },
    dietType: {
      type: 'mixed',
      mealsPerDay: 3,
      emissionsKgPerWeek: (catMap['food'] ?? 0) / weeklyDivider,
    },
    lifestyle: {
      shoppingFrequency: 'moderate',
      plasticUsageLevel: 'moderate',
      electronicsPerYear: 2,
      emissionsKgPerWeek: (catMap['lifestyle'] ?? 0) / weeklyDivider,
    },
    overallScoreKgPerWeek:
      Object.values(catMap).reduce((sum, v) => sum + v, 0) / weeklyDivider,
  };
}

function buildIdealProfile(): BehaviorProfile {
  return {
    transportMode: {
      primaryMode: 'public_transport',
      weeklyKm: 50,
      emissionsKgPerWeek: 50 * TRANSPORT_FACTORS.bus!.factor,
      breakdown: [
        { mode: 'bus', km: 30, kg: 30 * TRANSPORT_FACTORS.bus!.factor },
        { mode: 'bike', km: 20, kg: 0 },
      ],
    },
    energyUsage: {
      monthlyKwh: 150,
      gasUsageLiters: 5,
      waterUsageLiters: 3000,
      emissionsKgPerWeek:
        ((150 * HOME_FACTORS.electricity!.factor) + (5 * HOME_FACTORS.lpg_gas!.factor) + (3000 * HOME_FACTORS.water!.factor)) / 4,
    },
    dietType: {
      type: 'vegetarian',
      mealsPerDay: 3,
      emissionsKgPerWeek: 21 * FOOD_FACTORS.vegetarian!.factor,
    },
    lifestyle: {
      shoppingFrequency: 'minimal',
      plasticUsageLevel: 'low',
      electronicsPerYear: 1,
      emissionsKgPerWeek:
        (1 * LIFESTYLE_FACTORS.shopping!.factor + 0.5 * LIFESTYLE_FACTORS.plastic!.factor) / 4,
    },
    overallScoreKgPerWeek: 0, // Will calculate
  };
}

function calculateGapAnalysis(current: BehaviorProfile, ideal: BehaviorProfile): GapAnalysis {
  const categories = [
    { category: 'Transportation', currentKg: current.transportMode.emissionsKgPerWeek, idealKg: ideal.transportMode.emissionsKgPerWeek },
    { category: 'Home & Energy', currentKg: current.energyUsage.emissionsKgPerWeek, idealKg: ideal.energyUsage.emissionsKgPerWeek },
    { category: 'Food & Diet', currentKg: current.dietType.emissionsKgPerWeek, idealKg: ideal.dietType.emissionsKgPerWeek },
    { category: 'Lifestyle', currentKg: current.lifestyle.emissionsKgPerWeek, idealKg: ideal.lifestyle.emissionsKgPerWeek },
  ];

  const totalGapKg = categories.reduce((sum, c) => sum + Math.max(0, c.currentKg - c.idealKg), 0);
  const totalCurrentKg = categories.reduce((sum, c) => sum + c.currentKg, 0);

  const gapCategories = categories.map((c) => {
    const gap = Math.max(0, c.currentKg - c.idealKg);
    return {
      category: c.category,
      currentKg: Math.round(c.currentKg * 100) / 100,
      idealKg: Math.round(c.idealKg * 100) / 100,
      gapKg: Math.round(gap * 100) / 100,
      gapPercent: c.currentKg > 0 ? Math.round((gap / c.currentKg) * 100) : 0,
      difficulty: gap > c.currentKg * 0.5 ? 'hard' as const : gap > c.currentKg * 0.2 ? 'medium' as const : 'easy' as const,
    };
  });

  const priorityActions = gapCategories
    .filter((c) => c.gapKg > 0)
    .sort((a, b) => b.gapKg - a.gapKg)
    .map((c, idx) => ({
      rank: idx + 1,
      action: `Reduce ${c.category} emissions by ${c.gapPercent}%`,
      impactKgPerWeek: c.gapKg,
      difficulty: c.difficulty,
      category: c.category,
    }));

  return {
    totalGapKgPerWeek: Math.round(totalGapKg * 100) / 100,
    totalGapPercent: totalCurrentKg > 0 ? Math.round((totalGapKg / totalCurrentKg) * 100) : 0,
    categories: gapCategories,
    priorityActions,
  };
}

function calculateProjectedSavings(gapKgPerWeek: number): ProjectedSavings {
  return {
    weeklyKgSaved: Math.round(gapKgPerWeek * 100) / 100,
    monthlyKgSaved: Math.round(gapKgPerWeek * 4.33 * 100) / 100,
    annualKgSaved: Math.round(gapKgPerWeek * 52 * 100) / 100,
    equivalentTreesPlanted: Math.round((gapKgPerWeek * 52) / EQUIVALENTS.KG_PER_TREE_PER_YEAR * 10) / 10,
    equivalentFlightsAvoided: Math.round((gapKgPerWeek * 52) / EQUIVALENTS.KG_PER_DOMESTIC_FLIGHT * 10) / 10,
    costSavingsUsd: Math.round(gapKgPerWeek * 52 * EQUIVALENTS.USD_PER_KG_SAVED * 100) / 100,
  };
}

export const getTwin = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;

  const currentProfile = await buildCurrentProfile(userId);
  const idealProfile = buildIdealProfile();

  // Calculate ideal overall
  idealProfile.overallScoreKgPerWeek =
    idealProfile.transportMode.emissionsKgPerWeek +
    idealProfile.energyUsage.emissionsKgPerWeek +
    idealProfile.dietType.emissionsKgPerWeek +
    idealProfile.lifestyle.emissionsKgPerWeek;

  const gapAnalysis = calculateGapAnalysis(currentProfile, idealProfile);
  const projectedSavings = calculateProjectedSavings(gapAnalysis.totalGapKgPerWeek);

  const twin: SustainabilityTwin = {
    userId,
    generatedAt: new Date().toISOString(),
    currentProfile,
    idealProfile,
    gapAnalysis,
    projectedSavings,
  };

  sendSuccess(res, twin);
});
