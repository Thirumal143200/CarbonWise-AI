import type { Challenge } from '@carbonwise/shared';
import type { Request, Response } from 'express';

import { query, queryOne } from '../../config/database';
import { asyncHandler, AppError } from '../../middleware/error-handler.middleware';
import { sendSuccess } from '../../utils/response';

// ---- Controllers ----

export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const category = req.query.category as string | undefined;

  let challenges;
  if (category) {
    challenges = await query<Challenge & { active: boolean }>(
      'SELECT * FROM challenges WHERE active = true AND category = $1 ORDER BY xp_reward DESC',
      [category],
    );
  } else {
    challenges = await query<Challenge & { active: boolean }>(
      'SELECT * FROM challenges WHERE active = true ORDER BY xp_reward DESC',
    );
  }

  sendSuccess(res, {
    challenges: challenges.map((c) => ({
      id: c.id, slug: c.slug, title: c.title, description: c.description,
      category: c.category, durationDays: (c as unknown as Record<string, number>).duration_days,
      xpReward: (c as unknown as Record<string, number>).xp_reward,
      criteria: c.criteria, active: c.active,
    })),
  });
});

export const join = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const challengeId = req.params.id!;

  // Check challenge exists
  const challenge = await queryOne<{ id: string; duration_days: number }>(
    'SELECT id, duration_days FROM challenges WHERE id = $1 AND active = true',
    [challengeId],
  );
  if (!challenge) throw new AppError(404, 'NOT_FOUND', 'Challenge not found');

  // Check not already joined
  const existing = await queryOne(
    'SELECT id FROM user_challenges WHERE user_id = $1 AND challenge_id = $2',
    [userId, challengeId],
  );
  if (existing) throw new AppError(409, 'CONFLICT', 'Already joined this challenge');

  const endsAt = new Date();
  endsAt.setDate(endsAt.getDate() + challenge.duration_days);

  const rows = await query<{ id: string; started_at: Date; ends_at: Date; status: string; progress_pct: number }>(
    `INSERT INTO user_challenges (user_id, challenge_id, ends_at)
     VALUES ($1, $2, $3) RETURNING *`,
    [userId, challengeId, endsAt.toISOString().split('T')[0]],
  );

  sendSuccess(res, { userChallenge: rows[0] });
});

export const updateProgress = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const challengeId = req.params.id!;
  const { progress_pct } = req.body as { progress_pct: number };

  if (progress_pct < 0 || progress_pct > 100) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Progress must be between 0 and 100');
  }

  const status = progress_pct >= 100 ? 'completed' : 'active';

  const result = await queryOne<{ id: string; progress_pct: number; status: string }>(
    `UPDATE user_challenges SET progress_pct = $1, status = $2
     WHERE user_id = $3 AND challenge_id = $4 AND status = 'active'
     RETURNING *`,
    [progress_pct, status, userId, challengeId],
  );

  if (!result) throw new AppError(404, 'NOT_FOUND', 'Active challenge not found');
  sendSuccess(res, { userChallenge: result });
});

export const active = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;

  const activeChallenges = await query<{
    id: string; challenge_id: string; started_at: Date; ends_at: Date;
    status: string; progress_pct: number; title: string; description: string;
    category: string; duration_days: number; xp_reward: number;
  }>(`
    SELECT uc.*, c.title, c.description, c.category, c.duration_days, c.xp_reward
    FROM user_challenges uc
    JOIN challenges c ON c.id = uc.challenge_id
    WHERE uc.user_id = $1 AND uc.status = 'active'
    ORDER BY uc.ends_at ASC
  `, [userId]);

  sendSuccess(res, {
    activeChallenges: activeChallenges.map((c) => ({
      id: c.id,
      challenge: {
        id: c.challenge_id, title: c.title, description: c.description,
        category: c.category, durationDays: c.duration_days, xpReward: c.xp_reward,
      },
      startedAt: c.started_at instanceof Date ? c.started_at.toISOString() : String(c.started_at),
      endsAt: c.ends_at instanceof Date ? c.ends_at.toISOString() : String(c.ends_at),
      status: c.status,
      progressPct: c.progress_pct,
    })),
  });
});
