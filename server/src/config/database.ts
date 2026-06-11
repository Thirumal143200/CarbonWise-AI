import { Pool } from 'pg';

import { logger } from '../utils/logger';

import { env } from './env';

/**
 * PostgreSQL connection pool.
 * - Uses parameterized queries exclusively (SQL injection protection)
 * - Connection pool prevents exhaustion under load
 * - SSL required in production (Supabase)
 */
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.NODE_ENV === 'production' ? 20 : 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  ssl: env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Log pool errors (don't crash — let the request handler deal with it)
pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected database pool error');
});

/**
 * Execute a parameterized query.
 * NEVER use string interpolation for SQL — always use $1, $2 params.
 */
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const start = Date.now();
  const result = await pool.query(text, params);
  const duration = Date.now() - start;

  logger.debug({ query: text, duration, rows: result.rowCount }, 'Executed query');

  return result.rows as T[];
}

/**
 * Execute a query and return the first row or null.
 */
export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Health check — verifies database connectivity.
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    await pool.query('SELECT 1');
    return true;
  } catch {
    return false;
  }
}

/**
 * Graceful shutdown — drain the pool.
 */
export async function closeDatabasePool(): Promise<void> {
  await pool.end();
  logger.info('Database pool closed');
}
