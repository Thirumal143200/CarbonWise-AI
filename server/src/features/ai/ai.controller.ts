import type { Request, Response } from 'express';
import { z } from 'zod';

import { query } from '../../config/database';
import { asyncHandler } from '../../middleware/error-handler.middleware';
import { sendSuccess } from '../../utils/response';
import * as carbonRepo from '../carbon/carbon.repository';

import { generateContent } from './gemini.client';

// ---- Repository ----

interface AIRecommendationRow {
  id: string;
  user_id: string;
  prompt: string;
  response: string;
  recommendation_type: string;
  created_at: Date;
}

async function storeRecommendation(
  userId: string,
  prompt: string,
  response: string,
  type: string,
): Promise<void> {
  await query(
    `INSERT INTO ai_recommendations (user_id, prompt, response, recommendation_type)
     VALUES ($1, $2, $3, $4)`,
    [userId, prompt, response, type],
  );
}

async function getRecommendations(
  userId: string,
  type?: string,
  limit = 10,
): Promise<AIRecommendationRow[]> {
  if (type) {
    return query<AIRecommendationRow>(
      `SELECT * FROM ai_recommendations
       WHERE user_id = $1 AND recommendation_type = $2
       ORDER BY created_at DESC LIMIT $3`,
      [userId, type, limit],
    );
  }
  return query<AIRecommendationRow>(
    'SELECT * FROM ai_recommendations WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
    [userId, limit],
  );
}

// ---- Schemas ----

const recommendationSchema = z.object({
  type: z.enum(['weekly_plan', 'reduction_advice', 'behavioral_insight']),
});

const chatSchema = z.object({
  message: z.string().min(1).max(1000),
});

// ---- Controllers ----

export const generateRecommendation = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { type } = req.body as { type: string };

  // Fetch user's recent carbon data for context
  const recentEntries = await carbonRepo.getRecentEntries(userId, 20);
  const categorySummary = await carbonRepo.getCategorySummary(userId);

  const contextData = {
    recentEntries: recentEntries.map((e) => ({
      category: e.category,
      subcategory: e.subcategory,
      emissionsKg: e.emissions_kg,
      date: e.entry_date,
    })),
    breakdown: categorySummary.map((c) => ({
      category: c.category,
      totalKg: c.total_kg,
    })),
  };

  const prompts: Record<string, string> = {
    weekly_plan: `Based on this user's carbon footprint data: ${JSON.stringify(contextData)}, create a personalized weekly sustainability plan. Return a JSON object with a "title", "days" array (each with "day", "action", "impact"), and "weeklyTotal".`,
    reduction_advice: `Based on this user's carbon footprint data: ${JSON.stringify(contextData)}, provide personalized carbon reduction recommendations. Return a JSON object with a "recommendations" array (each with "title", "description", "impact" (high/medium/low), "category").`,
    behavioral_insight: `Analyze this user's carbon footprint data: ${JSON.stringify(contextData)}. Identify behavioral patterns and suggest changes. Return a JSON object with "insights" array (each with "pattern", "suggestion", "potentialSavingsKg").`,
  };

  const prompt = prompts[type] ?? prompts.reduction_advice!;
  const result = await generateContent(prompt);

  await storeRecommendation(userId, prompt, result.text, type);

  let parsed: unknown;
  try {
    parsed = JSON.parse(result.text);
  } catch {
    parsed = { raw: result.text };
  }

  sendSuccess(res, { recommendation: parsed, type });
});

export const listRecommendations = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const type = req.query.type as string | undefined;
  const limit = Number(req.query.limit) || 10;

  const recommendations = await getRecommendations(userId, type, limit);

  sendSuccess(res, {
    recommendations: recommendations.map((r) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(r.response);
      } catch {
        parsed = { raw: r.response };
      }
      return {
        id: r.id,
        type: r.recommendation_type,
        content: parsed,
        createdAt: r.created_at.toISOString(),
      };
    }),
  });
});

export const chat = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { message } = req.body as { message: string };

  const recentEntries = await carbonRepo.getRecentEntries(userId, 10);
  const context = recentEntries.map((e) => `${e.category}/${e.subcategory}: ${e.emissions_kg}kg`).join(', ');

  const prompt = `You are CarbonWise AI, a friendly sustainability coach. The user's recent carbon data: [${context}]. User message: "${message}". Respond helpfully about sustainability and carbon reduction. Keep response under 200 words.`;

  const result = await generateContent(prompt);

  await storeRecommendation(userId, message, result.text, 'chat');

  sendSuccess(res, { response: result.text });
});

export { recommendationSchema, chatSchema };
