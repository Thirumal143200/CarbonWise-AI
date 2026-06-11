// ============================================
// Sustainability Twin Types
// ============================================

export interface SustainabilityTwin {
  userId: string;
  generatedAt: string;

  /** Current behavior profile */
  currentProfile: BehaviorProfile;

  /** AI-generated ideal low-carbon version */
  idealProfile: BehaviorProfile;

  /** Gap analysis between current and ideal */
  gapAnalysis: GapAnalysis;

  /** Projected savings if user adopts ideal behaviors */
  projectedSavings: ProjectedSavings;
}

export interface BehaviorProfile {
  transportMode: TransportBehavior;
  energyUsage: EnergyBehavior;
  dietType: DietBehavior;
  lifestyle: LifestyleBehavior;
  overallScoreKgPerWeek: number;
}

export interface TransportBehavior {
  primaryMode: string;
  weeklyKm: number;
  emissionsKgPerWeek: number;
  breakdown: { mode: string; km: number; kg: number }[];
}

export interface EnergyBehavior {
  monthlyKwh: number;
  gasUsageLiters: number;
  waterUsageLiters: number;
  emissionsKgPerWeek: number;
}

export interface DietBehavior {
  type: string;
  mealsPerDay: number;
  emissionsKgPerWeek: number;
}

export interface LifestyleBehavior {
  shoppingFrequency: string;
  plasticUsageLevel: string;
  electronicsPerYear: number;
  emissionsKgPerWeek: number;
}

export interface GapAnalysis {
  totalGapKgPerWeek: number;
  totalGapPercent: number;
  categories: GapCategory[];
  priorityActions: PriorityAction[];
}

export interface GapCategory {
  category: string;
  currentKg: number;
  idealKg: number;
  gapKg: number;
  gapPercent: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface PriorityAction {
  rank: number;
  action: string;
  impactKgPerWeek: number;
  difficulty: 'easy' | 'medium' | 'hard';
  category: string;
}

export interface ProjectedSavings {
  weeklyKgSaved: number;
  monthlyKgSaved: number;
  annualKgSaved: number;
  equivalentTreesPlanted: number;
  equivalentFlightsAvoided: number;
  costSavingsUsd: number;
}
