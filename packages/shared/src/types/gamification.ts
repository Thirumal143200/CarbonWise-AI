// ============================================
// Gamification Types
// ============================================

export interface GamificationProfile {
  ecoScore: number;
  xp: number;
  level: number;
  nextLevelXp: number;
  currentLevelXp: number;
  rank: string;
  streakDays: number;
}

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  xpReward: number;
  criteriaType: AchievementCriteriaType;
  criteriaValue: Record<string, unknown>;
}

export type AchievementCriteriaType =
  | 'entries_count'
  | 'streak_days'
  | 'reduction_percent'
  | 'challenge_complete'
  | 'quiz_score'
  | 'eco_score';

export interface UserAchievement {
  id: string;
  achievement: Achievement;
  earnedAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  ecoScore: number;
  level: number;
}

// ---- Goals ----

export interface Goal {
  id: string;
  userId: string;
  title: string;
  targetReductionPct: number;
  baselineKg: number;
  currentKg: number;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  progressPct: number;
  createdAt: string;
  updatedAt: string;
}

export type GoalStatus = 'active' | 'completed' | 'failed' | 'cancelled';

export interface CreateGoalRequest {
  title: string;
  targetReductionPct: number;
  startDate: string;
  endDate: string;
}

export interface UpdateGoalRequest {
  title?: string;
  targetReductionPct?: number;
  status?: GoalStatus;
}

// ---- Challenges ----

export interface Challenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  durationDays: number;
  xpReward: number;
  criteria: Record<string, unknown>;
  active: boolean;
}

export interface UserChallenge {
  id: string;
  challenge: Challenge;
  startedAt: string;
  endsAt: string;
  status: ChallengeStatus;
  progressPct: number;
  updatedAt: string;
}

export type ChallengeStatus = 'active' | 'completed' | 'failed' | 'abandoned';

// ---- XP & Levels ----

/** XP thresholds per level (cumulative) */
export const LEVEL_THRESHOLDS: readonly number[] = [
  0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500, 6600, 7800, 9100, 10500, 12000,
  13600, 15300, 17100, 19000, 21000,
] as const;

export const LEVEL_RANKS: readonly string[] = [
  'Seedling',
  'Sprout',
  'Sapling',
  'Green Thumb',
  'Eco Warrior',
  'Nature Guardian',
  'Earth Protector',
  'Climate Champion',
  'Sustainability Hero',
  'Carbon Neutral Master',
  'Eco Legend',
  'Planet Savior',
  'Green Titan',
  'Earth Sovereign',
  'Climate Sage',
  'Eco Visionary',
  'Gaia\'s Chosen',
  'Sustainability Oracle',
  'Carbon Zero',
  'Planetary Guardian',
  'Eco Transcendent',
] as const;
