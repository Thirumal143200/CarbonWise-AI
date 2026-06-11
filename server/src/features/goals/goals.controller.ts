import { createGoalSchema, updateGoalSchema } from '@carbonwise/shared';
import type { Goal } from '@carbonwise/shared';
import type { Request, Response } from 'express';

import { query, queryOne } from '../../config/database';
import { asyncHandler, AppError } from '../../middleware/error-handler.middleware';
import { sendSuccess, sendCreated } from '../../utils/response';
import * as carbonRepo from '../carbon/carbon.repository';

// ---- Repository ----

interface GoalRow {
  id: string;
  user_id: string;
  title: string;
  target_reduction_pct: number;
  baseline_kg: number;
  start_date: Date;
  end_date: Date;
  status: string;
  created_at: Date;
  updated_at: Date;
}

function toGoal(row: GoalRow, currentKg = 0): Goal {
  const baselineKg = row.baseline_kg || 0;
  const reductionKg = Math.max(0, baselineKg - currentKg);
  const progressPct = baselineKg > 0
    ? Math.min(100, Math.round((reductionKg / (baselineKg * row.target_reduction_pct / 100)) * 100))
    : 0;

  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    targetReductionPct: row.target_reduction_pct,
    baselineKg,
    currentKg,
    startDate: row.start_date instanceof Date ? row.start_date.toISOString().split('T')[0]! : String(row.start_date),
    endDate: row.end_date instanceof Date ? row.end_date.toISOString().split('T')[0]! : String(row.end_date),
    status: row.status as Goal['status'],
    progressPct,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

// ---- Controllers ----

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { title, targetReductionPct, startDate, endDate } = req.body as {
    title: string; targetReductionPct: number; startDate: string; endDate: string;
  };

  // Calculate baseline from current emissions
  const baseline = await carbonRepo.getTotalEmissions(userId, startDate, endDate);

  const rows = await query<GoalRow>(
    `INSERT INTO goals (user_id, title, target_reduction_pct, baseline_kg, start_date, end_date)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, title, targetReductionPct, baseline || 0, startDate, endDate],
  );

  sendCreated(res, { goal: toGoal(rows[0]!, baseline) });
});

export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const status = req.query.status as string | undefined;

  let goals: GoalRow[];
  if (status) {
    goals = await query<GoalRow>(
      'SELECT * FROM goals WHERE user_id = $1 AND status = $2 ORDER BY created_at DESC',
      [userId, status],
    );
  } else {
    goals = await query<GoalRow>(
      'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC',
      [userId],
    );
  }

  // Calculate current emissions for each goal's date range
  const goalsWithProgress = await Promise.all(
    goals.map(async (g) => {
      const start = g.start_date instanceof Date ? g.start_date.toISOString().split('T')[0]! : String(g.start_date);
      const end = g.end_date instanceof Date ? g.end_date.toISOString().split('T')[0]! : String(g.end_date);
      const currentKg = await carbonRepo.getTotalEmissions(userId, start, end);
      return toGoal(g, currentKg);
    }),
  );

  sendSuccess(res, { goals: goalsWithProgress });
});

export const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const goal = await queryOne<GoalRow>(
    'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
    [req.params.id, userId],
  );
  if (!goal) throw new AppError(404, 'NOT_FOUND', 'Goal not found');

  const start = goal.start_date instanceof Date ? goal.start_date.toISOString().split('T')[0]! : String(goal.start_date);
  const end = goal.end_date instanceof Date ? goal.end_date.toISOString().split('T')[0]! : String(goal.end_date);
  const currentKg = await carbonRepo.getTotalEmissions(userId, start, end);

  sendSuccess(res, { goal: toGoal(goal, currentKg) });
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const updates = req.body as { title?: string; targetReductionPct?: number; status?: string };

  const setClauses: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  if (updates.title) { setClauses.push(`title = $${idx++}`); values.push(updates.title); }
  if (updates.targetReductionPct) { setClauses.push(`target_reduction_pct = $${idx++}`); values.push(updates.targetReductionPct); }
  if (updates.status) { setClauses.push(`status = $${idx++}`); values.push(updates.status); }

  if (setClauses.length === 0) {
    throw new AppError(400, 'VALIDATION_ERROR', 'No fields to update');
  }

  values.push(req.params.id, userId);
  const goal = await queryOne<GoalRow>(
    `UPDATE goals SET ${setClauses.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values,
  );

  if (!goal) throw new AppError(404, 'NOT_FOUND', 'Goal not found');
  sendSuccess(res, { goal: toGoal(goal) });
});

export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const result = await query('DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, userId]);
  if (result.length === 0) throw new AppError(404, 'NOT_FOUND', 'Goal not found');
  sendSuccess(res, { message: 'Goal deleted successfully' });
});

export { createGoalSchema, updateGoalSchema };
