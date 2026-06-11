// ============================================
// Dashboard Types
// ============================================

import type { CategoryBreakdown, CarbonEntry, TrendDataPoint } from './carbon';

export interface DashboardOverview {
  daily: PeriodSummary;
  weekly: PeriodSummary;
  monthly: PeriodSummary;
  annual: PeriodSummary;
  breakdown: CategoryBreakdown[];
  recentEntries: CarbonEntry[];
  comparisonWithAverage: ComparisonMetric;
}

export interface PeriodSummary {
  totalKg: number;
  changePercent: number; // vs previous period
  entryCount: number;
}

export interface ComparisonMetric {
  userKg: number;
  nationalAverageKg: number;
  globalAverageKg: number;
  percentBelowAverage: number;
}

export interface DashboardTrends {
  period: string;
  dataPoints: TrendDataPoint[];
}
