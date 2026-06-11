// ============================================
// Carbon Footprint Forecasting Types
// ============================================

export interface ForecastRequest {
  horizon: ForecastHorizon;
}

export type ForecastHorizon = 'week' | 'month' | 'year';

export interface ForecastResponse {
  horizon: ForecastHorizon;
  predictions: ForecastDataPoint[];
  confidence: ConfidenceMetrics;
  methodology: string;
  generatedAt: string;
}

export interface ForecastDataPoint {
  date: string;
  predictedKg: number;
  lowerBound: number;
  upperBound: number;
  confidenceScore: number; // 0-1
}

export interface ConfidenceMetrics {
  overall: number; // 0-1
  dataPointsUsed: number;
  modelAccuracy: number; // historical back-test accuracy
  factors: ConfidenceFactor[];
}

export interface ConfidenceFactor {
  name: string;
  impact: 'positive' | 'negative' | 'neutral';
  description: string;
}

/**
 * Internal: data shape for the forecasting engine's
 * weighted moving average + seasonal decomposition
 */
export interface ForecastModelInput {
  dailyTotals: { date: string; totalKg: number }[];
  categoryBreakdowns: { date: string; category: string; totalKg: number }[];
  seasonalPatterns: SeasonalPattern[];
}

export interface SeasonalPattern {
  dayOfWeek: number; // 0-6
  averageKg: number;
  stdDev: number;
}
