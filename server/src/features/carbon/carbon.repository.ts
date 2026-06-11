import { query, queryOne } from '../../config/database';

// ---- Row types ----

export interface CarbonEntryRow {
  id: string;
  user_id: string;
  category: string;
  subcategory: string;
  amount: number;
  unit: string;
  emissions_kg: number;
  entry_date: Date;
  metadata: Record<string, unknown>;
  created_at: Date;
}

export interface CategorySummaryRow {
  category: string;
  total_kg: number;
}

export interface DailySummaryRow {
  entry_date: string;
  total_kg: number;
}

// ---- Queries ----

export async function createEntry(
  userId: string,
  category: string,
  subcategory: string,
  amount: number,
  unit: string,
  emissionsKg: number,
  entryDate: string,
  metadata: Record<string, unknown> = {},
): Promise<CarbonEntryRow> {
  const rows = await query<CarbonEntryRow>(
    `INSERT INTO carbon_entries (user_id, category, subcategory, amount, unit, emissions_kg, entry_date, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     RETURNING *`,
    [userId, category, subcategory, amount, unit, emissionsKg, entryDate, JSON.stringify(metadata)],
  );
  return rows[0]!;
}

export async function findEntryById(id: string, userId: string): Promise<CarbonEntryRow | null> {
  return queryOne<CarbonEntryRow>(
    'SELECT * FROM carbon_entries WHERE id = $1 AND user_id = $2',
    [id, userId],
  );
}

export async function listEntries(
  userId: string,
  params: { page: number; limit: number; from?: string; to?: string; category?: string },
): Promise<{ entries: CarbonEntryRow[]; total: number }> {
  const conditions = ['user_id = $1'];
  const values: unknown[] = [userId];
  let paramIdx = 2;

  if (params.from) {
    conditions.push(`entry_date >= $${paramIdx++}`);
    values.push(params.from);
  }
  if (params.to) {
    conditions.push(`entry_date <= $${paramIdx++}`);
    values.push(params.to);
  }
  if (params.category) {
    conditions.push(`category = $${paramIdx++}`);
    values.push(params.category);
  }

  const where = conditions.join(' AND ');
  const offset = (params.page - 1) * params.limit;

  const countResult = await query<{ count: string }>(
    `SELECT COUNT(*) as count FROM carbon_entries WHERE ${where}`,
    values,
  );
  const total = parseInt(countResult[0]?.count ?? '0', 10);

  values.push(params.limit, offset);
  const entries = await query<CarbonEntryRow>(
    `SELECT * FROM carbon_entries WHERE ${where}
     ORDER BY entry_date DESC, created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx}`,
    values,
  );

  return { entries, total };
}

export async function updateEntry(
  id: string,
  userId: string,
  updates: { amount?: number; unit?: string; emissions_kg?: number; metadata?: Record<string, unknown> },
): Promise<CarbonEntryRow | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (updates.amount !== undefined) {
    setClauses.push(`amount = $${paramIdx++}`);
    values.push(updates.amount);
  }
  if (updates.unit !== undefined) {
    setClauses.push(`unit = $${paramIdx++}`);
    values.push(updates.unit);
  }
  if (updates.emissions_kg !== undefined) {
    setClauses.push(`emissions_kg = $${paramIdx++}`);
    values.push(updates.emissions_kg);
  }
  if (updates.metadata !== undefined) {
    setClauses.push(`metadata = $${paramIdx++}`);
    values.push(JSON.stringify(updates.metadata));
  }

  if (setClauses.length === 0) return findEntryById(id, userId);

  values.push(id, userId);
  return queryOne<CarbonEntryRow>(
    `UPDATE carbon_entries SET ${setClauses.join(', ')}
     WHERE id = $${paramIdx++} AND user_id = $${paramIdx}
     RETURNING *`,
    values,
  );
}

export async function deleteEntry(id: string, userId: string): Promise<boolean> {
  const result = await query(
    'DELETE FROM carbon_entries WHERE id = $1 AND user_id = $2 RETURNING id',
    [id, userId],
  );
  return result.length > 0;
}

export async function getCategorySummary(
  userId: string,
  from?: string,
  to?: string,
): Promise<CategorySummaryRow[]> {
  const conditions = ['user_id = $1'];
  const values: unknown[] = [userId];
  let paramIdx = 2;

  if (from) {
    conditions.push(`entry_date >= $${paramIdx++}`);
    values.push(from);
  }
  if (to) {
    conditions.push(`entry_date <= $${paramIdx++}`);
    values.push(to);
  }

  return query<CategorySummaryRow>(
    `SELECT category, SUM(emissions_kg) as total_kg
     FROM carbon_entries WHERE ${conditions.join(' AND ')}
     GROUP BY category ORDER BY total_kg DESC`,
    values,
  );
}

export async function getDailyTotals(
  userId: string,
  from: string,
  to: string,
): Promise<DailySummaryRow[]> {
  return query<DailySummaryRow>(
    `SELECT entry_date::text as entry_date, SUM(emissions_kg) as total_kg
     FROM carbon_entries
     WHERE user_id = $1 AND entry_date >= $2 AND entry_date <= $3
     GROUP BY entry_date ORDER BY entry_date`,
    [userId, from, to],
  );
}

export async function getTotalEmissions(
  userId: string,
  from?: string,
  to?: string,
): Promise<number> {
  const conditions = ['user_id = $1'];
  const values: unknown[] = [userId];
  let paramIdx = 2;

  if (from) {
    conditions.push(`entry_date >= $${paramIdx++}`);
    values.push(from);
  }
  if (to) {
    conditions.push(`entry_date <= $${paramIdx++}`);
    values.push(to);
  }

  const result = await query<{ total: string }>(
    `SELECT COALESCE(SUM(emissions_kg), 0) as total
     FROM carbon_entries WHERE ${conditions.join(' AND ')}`,
    values,
  );
  return parseFloat(result[0]?.total ?? '0');
}

export async function getRecentEntries(userId: string, limit = 5): Promise<CarbonEntryRow[]> {
  return query<CarbonEntryRow>(
    `SELECT * FROM carbon_entries WHERE user_id = $1
     ORDER BY entry_date DESC, created_at DESC LIMIT $2`,
    [userId, limit],
  );
}
