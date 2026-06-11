import { query, queryOne } from '../../config/database';

/**
 * Auth repository — data access layer for users and tokens.
 * All queries use parameterized $1, $2 syntax (SQL injection protection).
 */

// ---- User Row Types (DB representation) ----

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  name: string;
  avatar_url: string | null;
  eco_score: number;
  xp: number;
  level: number;
  leaderboard_opt_in: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface RefreshTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  revoked: boolean;
  created_at: Date;
}

export interface PasswordResetTokenRow {
  id: string;
  user_id: string;
  token_hash: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

// ---- User Queries ----

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE email = $1', [email]);
}

export async function findUserById(id: string): Promise<UserRow | null> {
  return queryOne<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
}

export async function createUser(
  email: string,
  passwordHash: string,
  name: string,
): Promise<UserRow> {
  const rows = await query<UserRow>(
    `INSERT INTO users (email, password_hash, name)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [email, passwordHash, name],
  );
  return rows[0]!;
}

export async function updateUser(
  id: string,
  updates: { name?: string; avatar_url?: string; leaderboard_opt_in?: boolean },
): Promise<UserRow | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.name !== undefined) {
    setClauses.push(`name = $${paramIndex++}`);
    values.push(updates.name);
  }
  if (updates.avatar_url !== undefined) {
    setClauses.push(`avatar_url = $${paramIndex++}`);
    values.push(updates.avatar_url);
  }
  if (updates.leaderboard_opt_in !== undefined) {
    setClauses.push(`leaderboard_opt_in = $${paramIndex++}`);
    values.push(updates.leaderboard_opt_in);
  }

  if (setClauses.length === 0) return findUserById(id);

  values.push(id);
  const sql = `UPDATE users SET ${setClauses.join(', ')} WHERE id = $${paramIndex} RETURNING *`;

  return queryOne<UserRow>(sql, values);
}

export async function updateUserPassword(id: string, passwordHash: string): Promise<void> {
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, id]);
}

export async function updateUserXp(
  id: string,
  xpDelta: number,
  newLevel: number,
  ecoScore: number,
): Promise<void> {
  await query(
    'UPDATE users SET xp = xp + $1, level = $2, eco_score = $3 WHERE id = $4',
    [xpDelta, newLevel, ecoScore, id],
  );
}

// ---- Refresh Token Queries ----

export async function storeRefreshToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  await query(
    `INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

export async function findRefreshToken(tokenHash: string): Promise<RefreshTokenRow | null> {
  return queryOne<RefreshTokenRow>(
    `SELECT * FROM refresh_tokens
     WHERE token_hash = $1 AND revoked = false AND expires_at > NOW()`,
    [tokenHash],
  );
}

export async function revokeRefreshToken(tokenHash: string): Promise<void> {
  await query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [tokenHash]);
}

export async function revokeAllUserRefreshTokens(userId: string): Promise<void> {
  await query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [userId]);
}

// ---- Password Reset Token Queries ----

export async function storePasswordResetToken(
  userId: string,
  tokenHash: string,
  expiresAt: Date,
): Promise<void> {
  // Invalidate any existing unused reset tokens for this user
  await query(
    'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
    [userId],
  );

  await query(
    `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
     VALUES ($1, $2, $3)`,
    [userId, tokenHash, expiresAt],
  );
}

export async function findPasswordResetToken(
  tokenHash: string,
): Promise<PasswordResetTokenRow | null> {
  return queryOne<PasswordResetTokenRow>(
    `SELECT * FROM password_reset_tokens
     WHERE token_hash = $1 AND used = false AND expires_at > NOW()`,
    [tokenHash],
  );
}

export async function markPasswordResetTokenUsed(tokenHash: string): Promise<void> {
  await query('UPDATE password_reset_tokens SET used = true WHERE token_hash = $1', [tokenHash]);
}
