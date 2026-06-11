import { calculateEmissions, getEmissionFactor } from '@carbonwise/shared';
import type {
  CarbonEntry,
  CarbonSummary,
  CategoryBreakdown,
  TrendDataPoint,
  SummaryPeriod,
} from '@carbonwise/shared';

import { AppError } from '../../middleware/error-handler.middleware';

import * as carbonRepo from './carbon.repository';
import type { CarbonEntryRow } from './carbon.repository';

/**
 * Carbon service — business logic for carbon entry management.
 */

// ---- Helpers ----

function toEntry(row: CarbonEntryRow): CarbonEntry {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category as CarbonEntry['category'],
    subcategory: row.subcategory as CarbonEntry['subcategory'],
    amount: row.amount,
    unit: row.unit,
    emissionsKg: row.emissions_kg,
    entryDate: row.entry_date instanceof Date
      ? row.entry_date.toISOString().split('T')[0]!
      : String(row.entry_date),
    metadata: row.metadata,
    createdAt: row.created_at.toISOString(),
  };
}

function getDateRange(period: SummaryPeriod): { from: string; to: string } {
  const now = new Date();
  const to = now.toISOString().split('T')[0]!;
  let from: string;

  switch (period) {
    case 'daily':
      from = to;
      break;
    case 'weekly': {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      from = weekAgo.toISOString().split('T')[0]!;
      break;
    }
    case 'monthly': {
      const monthAgo = new Date(now);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      from = monthAgo.toISOString().split('T')[0]!;
      break;
    }
    case 'annual': {
      const yearAgo = new Date(now);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      from = yearAgo.toISOString().split('T')[0]!;
      break;
    }
  }

  return { from, to };
}

// ---- Service Methods ----

export async function createEntry(
  userId: string,
  data: {
    category: string;
    subcategory: string;
    amount: number;
    unit: string;
    entryDate: string;
    metadata?: Record<string, unknown>;
  },
): Promise<CarbonEntry> {
  // Validate that the subcategory has a known emission factor
  const factor = getEmissionFactor(data.category, data.subcategory);
  if (!factor) {
    throw new AppError(400, 'VALIDATION_ERROR', `Unknown category/subcategory: ${data.category}/${data.subcategory}`);
  }

  // Calculate emissions
  const emissionsKg = calculateEmissions(data.category, data.subcategory, data.amount);

  const row = await carbonRepo.createEntry(
    userId,
    data.category,
    data.subcategory,
    data.amount,
    data.unit,
    emissionsKg,
    data.entryDate,
    data.metadata ?? {},
  );

  return toEntry(row);
}

export async function getEntry(id: string, userId: string): Promise<CarbonEntry> {
  const row = await carbonRepo.findEntryById(id, userId);
  if (!row) throw new AppError(404, 'NOT_FOUND', 'Carbon entry not found');
  return toEntry(row);
}

export async function listEntries(
  userId: string,
  params: { page: number; limit: number; from?: string; to?: string; category?: string },
): Promise<{ entries: CarbonEntry[]; total: number; page: number; limit: number }> {
  const { entries, total } = await carbonRepo.listEntries(userId, params);
  return {
    entries: entries.map(toEntry),
    total,
    page: params.page,
    limit: params.limit,
  };
}

export async function updateEntry(
  id: string,
  userId: string,
  updates: { amount?: number; unit?: string; metadata?: Record<string, unknown> },
): Promise<CarbonEntry> {
  // If amount changed, recalculate emissions
  const existing = await carbonRepo.findEntryById(id, userId);
  if (!existing) throw new AppError(404, 'NOT_FOUND', 'Carbon entry not found');

  let newEmissions: number | undefined;
  if (updates.amount !== undefined) {
    newEmissions = calculateEmissions(existing.category, existing.subcategory, updates.amount);
  }

  const row = await carbonRepo.updateEntry(id, userId, {
    amount: updates.amount,
    unit: updates.unit,
    emissions_kg: newEmissions,
    metadata: updates.metadata,
  });

  if (!row) throw new AppError(404, 'NOT_FOUND', 'Carbon entry not found');
  return toEntry(row);
}

export async function deleteEntry(id: string, userId: string): Promise<void> {
  const deleted = await carbonRepo.deleteEntry(id, userId);
  if (!deleted) throw new AppError(404, 'NOT_FOUND', 'Carbon entry not found');
}

export async function getSummary(
  userId: string,
  period: SummaryPeriod,
): Promise<CarbonSummary> {
  const { from, to } = getDateRange(period);

  const [categorySummary, dailyTotals, totalKg] = await Promise.all([
    carbonRepo.getCategorySummary(userId, from, to),
    carbonRepo.getDailyTotals(userId, from, to),
    carbonRepo.getTotalEmissions(userId, from, to),
  ]);

  const breakdown: CategoryBreakdown[] = categorySummary.map((row) => ({
    category: row.category as CategoryBreakdown['category'],
    totalKg: parseFloat(String(row.total_kg)),
    percentage: totalKg > 0 ? Math.round((parseFloat(String(row.total_kg)) / totalKg) * 100) : 0,
  }));

  const trend: TrendDataPoint[] = dailyTotals.map((row) => ({
    date: row.entry_date,
    totalKg: parseFloat(String(row.total_kg)),
  }));

  return { totalKg, breakdown, trend };
}
