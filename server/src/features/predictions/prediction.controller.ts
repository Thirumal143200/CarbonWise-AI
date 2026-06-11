import type {
  ForecastResponse,
  ForecastDataPoint,
  ForecastHorizon,
  ConfidenceMetrics,
  SeasonalPattern,
} from '@carbonwise/shared';
import type { Request, Response } from 'express';

import { asyncHandler , AppError } from '../../middleware/error-handler.middleware';
import { sendSuccess } from '../../utils/response';
import * as carbonRepo from '../carbon/carbon.repository';

/**
 * Carbon Footprint Forecasting Engine
 *
 * Uses weighted moving average with seasonal decomposition:
 * 1. Calculate daily totals from historical data
 * 2. Detect day-of-week seasonal patterns
 * 3. Apply exponential smoothing for trend
 * 4. Generate predictions with confidence intervals
 */

function calculateSeasonalPatterns(dailyTotals: { date: string; total_kg: number }[]): SeasonalPattern[] {
  const byDayOfWeek: Record<number, number[]> = {};
  for (let i = 0; i < 7; i++) byDayOfWeek[i] = [];

  for (const entry of dailyTotals) {
    const dow = new Date(entry.date).getDay();
    byDayOfWeek[dow]!.push(parseFloat(String(entry.total_kg)));
  }

  return Array.from({ length: 7 }, (_, i) => {
    const values = byDayOfWeek[i] ?? [];
    const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    const variance = values.length > 1
      ? values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / (values.length - 1)
      : 0;
    return {
      dayOfWeek: i,
      averageKg: Math.round(avg * 1000) / 1000,
      stdDev: Math.round(Math.sqrt(variance) * 1000) / 1000,
    };
  });
}

function exponentialSmoothing(data: number[], alpha = 0.3): number[] {
  if (data.length === 0) return [];
  const smoothed = [data[0]!];
  for (let i = 1; i < data.length; i++) {
    smoothed.push(alpha * data[i]! + (1 - alpha) * smoothed[i - 1]!);
  }
  return smoothed;
}

function generatePredictions(
  seasonalPatterns: SeasonalPattern[],
  trend: number[],
  startDate: Date,
  days: number,
): ForecastDataPoint[] {
  const lastTrend = trend.length > 0 ? trend[trend.length - 1]! : 5;
  const trendSlope = trend.length > 1
    ? (trend[trend.length - 1]! - trend[trend.length - 2]!) / lastTrend
    : 0;

  const predictions: ForecastDataPoint[] = [];

  for (let i = 1; i <= days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dow = date.getDay();
    const seasonal = seasonalPatterns[dow]!;

    // Combine trend + seasonal component
    const trendComponent = lastTrend * (1 + trendSlope * i * 0.01);
    const predicted = Math.max(0, seasonal.averageKg > 0 ? seasonal.averageKg + trendComponent * 0.1 : trendComponent);

    // Confidence decreases with distance
    const distanceFactor = Math.max(0.3, 1 - (i / days) * 0.5);
    const dataQuality = seasonal.stdDev > 0 ? Math.max(0.4, 1 - seasonal.stdDev / (seasonal.averageKg || 1)) : 0.5;
    const confidence = Math.round(distanceFactor * dataQuality * 100) / 100;

    const uncertainty = seasonal.stdDev * (1 + i * 0.05);

    predictions.push({
      date: date.toISOString().split('T')[0]!,
      predictedKg: Math.round(predicted * 100) / 100,
      lowerBound: Math.round(Math.max(0, predicted - uncertainty) * 100) / 100,
      upperBound: Math.round((predicted + uncertainty) * 100) / 100,
      confidenceScore: confidence,
    });
  }

  return predictions;
}

export const forecast = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const horizon = (req.query.horizon as ForecastHorizon) || 'week';

  const daysMap: Record<ForecastHorizon, number> = { week: 7, month: 30, year: 365 };
  const forecastDays = daysMap[horizon] ?? 7;

  // Need at least 7 days of data for meaningful predictions
  const historyDays = Math.max(90, forecastDays * 3);
  const historyFrom = new Date();
  historyFrom.setDate(historyFrom.getDate() - historyDays);
  const today = new Date();

  const dailyTotals = await carbonRepo.getDailyTotals(
    userId,
    historyFrom.toISOString().split('T')[0]!,
    today.toISOString().split('T')[0]!,
  );

  if (dailyTotals.length < 3) {
    throw new AppError(400, 'INSUFFICIENT_DATA', 'Need at least 3 days of carbon data for forecasting. Keep logging your activities!');
  }

  const mappedTotals = dailyTotals.map((d) => ({ date: d.entry_date, total_kg: parseFloat(String(d.total_kg)) }));
  const seasonalPatterns = calculateSeasonalPatterns(mappedTotals);
  const values = mappedTotals.map((d) => d.total_kg);
  const smoothedTrend = exponentialSmoothing(values);
  const predictions = generatePredictions(seasonalPatterns, smoothedTrend, today, forecastDays);

  const overallConfidence = predictions.reduce((sum, p) => sum + p.confidenceScore, 0) / predictions.length;

  const confidence: ConfidenceMetrics = {
    overall: Math.round(overallConfidence * 100) / 100,
    dataPointsUsed: dailyTotals.length,
    modelAccuracy: Math.round(Math.min(0.95, 0.5 + dailyTotals.length * 0.005) * 100) / 100,
    factors: [
      {
        name: 'Data Volume',
        impact: dailyTotals.length > 30 ? 'positive' : dailyTotals.length > 7 ? 'neutral' : 'negative',
        description: `${dailyTotals.length} data points available`,
      },
      {
        name: 'Pattern Consistency',
        impact: seasonalPatterns.some((p) => p.stdDev > p.averageKg * 0.5) ? 'negative' : 'positive',
        description: 'Day-of-week pattern stability',
      },
      {
        name: 'Forecast Horizon',
        impact: forecastDays <= 7 ? 'positive' : forecastDays <= 30 ? 'neutral' : 'negative',
        description: `${forecastDays}-day forecast window`,
      },
    ],
  };

  const result: ForecastResponse = {
    horizon,
    predictions,
    confidence,
    methodology: 'Exponential smoothing with day-of-week seasonal decomposition',
    generatedAt: new Date().toISOString(),
  };

  sendSuccess(res, result);
});
