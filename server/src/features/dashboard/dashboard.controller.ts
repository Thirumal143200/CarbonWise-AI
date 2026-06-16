import type { DashboardOverview, PeriodSummary, ComparisonMetric } from '@carbonwise/shared';
import { NATIONAL_AVERAGES } from '@carbonwise/shared';
import type { Request, Response } from 'express';

import { asyncHandler } from '../../middleware/error-handler.middleware';
import { query } from '../../config/database';
import { sendSuccess } from '../../utils/response';
import * as carbonRepo from '../carbon/carbon.repository';

/**
 * Dashboard controller — aggregates data from multiple sources
 * for the main dashboard view. Uses parallel queries for efficiency.
 */

interface DBEntry {
  entry_date: string;
  emissions_kg: number;
}

function getPeriodDates(period: 'daily' | 'weekly' | 'monthly' | 'annual'): {
  current: { from: string; to: string };
  previous: { from: string; to: string };
} {
  const now = new Date();
  const to = now.toISOString().split('T')[0]!;

  const getFrom = (daysBack: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysBack);
    return d.toISOString().split('T')[0]!;
  };

  switch (period) {
    case 'daily':
      return { current: { from: to, to }, previous: { from: getFrom(1), to: getFrom(1) } };
    case 'weekly':
      return { current: { from: getFrom(7), to }, previous: { from: getFrom(14), to: getFrom(8) } };
    case 'monthly':
      return {
        current: { from: getFrom(30), to },
        previous: { from: getFrom(60), to: getFrom(31) },
      };
    case 'annual':
      return {
        current: { from: getFrom(365), to },
        previous: { from: getFrom(730), to: getFrom(366) },
      };
  }
}

function getPeriodSummaryInMemory(
  entries: DBEntry[],
  period: 'daily' | 'weekly' | 'monthly' | 'annual',
): PeriodSummary {
  const dates = getPeriodDates(period);
  let currentTotal = 0;
  let previousTotal = 0;
  const currentUniqueDays = new Set<string>();

  for (const entry of entries) {
    const dateStr = entry.entry_date;
    const kg = Number(entry.emissions_kg);

    if (dateStr >= dates.current.from && dateStr <= dates.current.to) {
      currentTotal += kg;
      currentUniqueDays.add(dateStr);
    }
    if (dateStr >= dates.previous.from && dateStr <= dates.previous.to) {
      previousTotal += kg;
    }
  }

  const changePercent =
    previousTotal > 0 ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100) : 0;

  return {
    totalKg: Math.round(currentTotal * 100) / 100,
    changePercent,
    entryCount: currentUniqueDays.size,
  };
}

export const overview = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;

  // Get dates range
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0]!;
  const getFrom = (daysBack: number): string => {
    const d = new Date(now);
    d.setDate(d.getDate() - daysBack);
    return d.toISOString().split('T')[0]!;
  };
  const oldestDate = getFrom(730);

  // Parallel fetch: optimized single query for entry history plus category, recent, and total
  const [rawEntries, breakdown, recentEntries, annualTotal] = await Promise.all([
    query<DBEntry>(
      `SELECT entry_date::text as entry_date, emissions_kg
       FROM carbon_entries
       WHERE user_id = $1 AND entry_date >= $2 AND entry_date <= $3`,
      [userId, oldestDate, todayStr],
    ),
    carbonRepo.getCategorySummary(userId),
    carbonRepo.getRecentEntries(userId, 5),
    carbonRepo.getTotalEmissions(userId),
  ]);

  // Compute summaries in memory (12 queries saved)
  const daily = getPeriodSummaryInMemory(rawEntries, 'daily');
  const weekly = getPeriodSummaryInMemory(rawEntries, 'weekly');
  const monthly = getPeriodSummaryInMemory(rawEntries, 'monthly');
  const annual = getPeriodSummaryInMemory(rawEntries, 'annual');

  const formattedBreakdown = breakdown.map((row: carbonRepo.CategorySummaryRow) => ({
    category: row.category as 'transportation' | 'home' | 'lifestyle' | 'food',
    totalKg: parseFloat(String(row.total_kg)),
    percentage:
      annualTotal > 0 ? Math.round((parseFloat(String(row.total_kg)) / annualTotal) * 100) : 0,
  }));

  const comparisonWithAverage: ComparisonMetric = {
    userKg: annual.totalKg,
    nationalAverageKg: NATIONAL_AVERAGES.global ?? 4700,
    globalAverageKg: NATIONAL_AVERAGES.global ?? 4700,
    percentBelowAverage: NATIONAL_AVERAGES.global
      ? Math.round(((NATIONAL_AVERAGES.global - annual.totalKg) / NATIONAL_AVERAGES.global) * 100)
      : 0,
  };

  const data: DashboardOverview = {
    daily,
    weekly,
    monthly,
    annual,
    breakdown: formattedBreakdown,
    recentEntries: recentEntries.map((r) => ({
      id: r.id,
      userId: r.user_id,
      category: r.category as 'transportation' | 'home' | 'lifestyle' | 'food',
      subcategory: r.subcategory as never,
      amount: r.amount,
      unit: r.unit,
      emissionsKg: r.emissions_kg,
      entryDate:
        r.entry_date instanceof Date
          ? r.entry_date.toISOString().split('T')[0]!
          : String(r.entry_date),
      metadata: r.metadata,
      createdAt: r.created_at.toISOString(),
    })),
    comparisonWithAverage,
  };

  sendSuccess(res, data);
});

export const trends = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const period = (req.query.period as string) || 'monthly';
  const from = req.query.from as string | undefined;
  const to = req.query.to as string | undefined;

  const dates =
    from && to
      ? { from, to }
      : getPeriodDates(period as 'daily' | 'weekly' | 'monthly' | 'annual').current;

  const dataPoints = await carbonRepo.getDailyTotals(userId, dates.from, dates.to);

  sendSuccess(res, {
    period,
    dataPoints: dataPoints.map((d) => ({
      date: d.entry_date,
      totalKg: parseFloat(String(d.total_kg)),
    })),
  });
});
