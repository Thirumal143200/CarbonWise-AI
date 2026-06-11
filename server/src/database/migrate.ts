import fs from 'fs';
import path from 'path';

import { pool } from '../config/database';
import { logger } from '../utils/logger';

/**
 * Run all SQL migrations in order.
 * Migrations are idempotent (IF NOT EXISTS).
 */
async function migrate(): Promise<void> {
  const migrationsDir = path.join(__dirname, 'migrations');

  logger.info('Starting database migrations...');

  // Create migrations tracking table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id SERIAL PRIMARY KEY,
      filename VARCHAR(255) UNIQUE NOT NULL,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Get already-executed migrations
  const result = await pool.query('SELECT filename FROM _migrations ORDER BY id');
  const executed = new Set(result.rows.map((r: { filename: string }) => r.filename));

  // Read and sort migration files
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (executed.has(file)) {
      logger.info(`⏭️  Skipping (already applied): ${file}`);
      continue;
    }

    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      await pool.query('BEGIN');
      await pool.query(sql);
      await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
      await pool.query('COMMIT');
      logger.info(`✅ Applied migration: ${file}`);
    } catch (err) {
      await pool.query('ROLLBACK');
      logger.error({ err, file }, `❌ Failed migration: ${file}`);
      throw err;
    }
  }

  logger.info('All migrations complete');
  await pool.end();
}

migrate().catch((err: unknown) => {
  logger.error({ err: err as Error }, 'Migration failed');
  process.exit(1);
});
