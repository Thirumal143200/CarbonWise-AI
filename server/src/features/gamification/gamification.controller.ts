import { LEVEL_THRESHOLDS, LEVEL_RANKS } from '@carbonwise/shared';
import type { GamificationProfile, LeaderboardEntry } from '@carbonwise/shared';
import type { Request, Response } from 'express';

import { query, queryOne } from '../../config/database';
import { asyncHandler, AppError } from '../../middleware/error-handler.middleware';
import { sendSuccess } from '../../utils/response';

// ---- Helpers ----

function getLevelInfo(xp: number): { level: number; rank: string; currentLevelXp: number; nextLevelXp: number } {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]!) level = i + 1;
    else break;
  }
  const rank = LEVEL_RANKS[level - 1] ?? 'Seedling';
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level] ?? currentLevelXp + 1000;
  return { level, rank, currentLevelXp, nextLevelXp };
}

// ---- Controllers ----

export const profile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const user = await queryOne<{ eco_score: number; xp: number; level: number }>(
    'SELECT eco_score, xp, level FROM users WHERE id = $1', [userId],
  );
  if (!user) throw new AppError(404, 'NOT_FOUND', 'User not found');

  const { rank, currentLevelXp, nextLevelXp } = getLevelInfo(user.xp);

  // Calculate streak (consecutive days with entries)
  const streakResult = await query<{ streak: string }>(`
    WITH dated AS (
      SELECT DISTINCT entry_date FROM carbon_entries
      WHERE user_id = $1 ORDER BY entry_date DESC
    ),
    streaks AS (
      SELECT entry_date,
        entry_date - (ROW_NUMBER() OVER (ORDER BY entry_date DESC))::int AS grp
      FROM dated
    )
    SELECT COUNT(*) as streak FROM streaks
    WHERE grp = (SELECT grp FROM streaks LIMIT 1)
  `, [userId]);

  const data: GamificationProfile = {
    ecoScore: user.eco_score,
    xp: user.xp,
    level: user.level,
    nextLevelXp,
    currentLevelXp,
    rank,
    streakDays: parseInt(streakResult[0]?.streak ?? '0', 10),
  };

  sendSuccess(res, data);
});

export const achievements = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;

  const earned = await query<{
    id: string; slug: string; name: string; description: string;
    icon: string; xp_reward: number; earned_at: Date;
  }>(`
    SELECT a.id, a.slug, a.name, a.description, a.icon, a.xp_reward, ua.earned_at
    FROM user_achievements ua
    JOIN achievements a ON a.id = ua.achievement_id
    WHERE ua.user_id = $1 ORDER BY ua.earned_at DESC
  `, [userId]);

  const available = await query<{
    id: string; slug: string; name: string; description: string;
    icon: string; xp_reward: number; criteria_type: string; criteria_value: Record<string, unknown>;
  }>(`
    SELECT a.* FROM achievements a
    WHERE a.id NOT IN (SELECT achievement_id FROM user_achievements WHERE user_id = $1)
  `, [userId]);

  sendSuccess(res, {
    earned: earned.map((a) => ({
      id: a.id, slug: a.slug, name: a.name, description: a.description,
      icon: a.icon, xpReward: a.xp_reward, earnedAt: a.earned_at.toISOString(),
    })),
    available: available.map((a) => ({
      id: a.id, slug: a.slug, name: a.name, description: a.description,
      icon: a.icon, xpReward: a.xp_reward, criteriaType: a.criteria_type,
    })),
  });
});

export const leaderboard = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  // Only show users who opted in
  const rankings = await query<{
    id: string; name: string; avatar_url: string | null;
    eco_score: number; level: number;
  }>(`
    SELECT id, name, avatar_url, eco_score, level
    FROM users WHERE leaderboard_opt_in = true
    ORDER BY eco_score DESC, xp DESC
    LIMIT $1
  `, [limit]);

  const entries: LeaderboardEntry[] = rankings.map((r, idx) => ({
    rank: idx + 1,
    userId: r.id,
    name: r.name,
    avatarUrl: r.avatar_url,
    ecoScore: r.eco_score,
    level: r.level,
  }));

  sendSuccess(res, { rankings: entries });
});
