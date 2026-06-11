import crypto from 'crypto';

import jwt from 'jsonwebtoken';

import { env } from '../config/env';

export interface AccessTokenPayload {
  userId: string;
  email: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

/**
 * Generate a short-lived access token (15 min default).
 * Contains only user ID and email — minimal claims.
 */
export function generateAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as any,
    issuer: 'carbonwise',
    audience: 'carbonwise-api',
  });
}

/**
 * Generate a long-lived refresh token (7 day default).
 * Contains token ID for rotation/revocation tracking.
 */
export function generateRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRY as any,
    issuer: 'carbonwise',
    audience: 'carbonwise-api',
  });
}

/**
 * Verify and decode an access token.
 * Returns null on invalid/expired tokens (no exceptions).
 */
export function verifyAccessToken(token: string): AccessTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'carbonwise',
      audience: 'carbonwise-api',
    }) as AccessTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Verify and decode a refresh token.
 * Returns null on invalid/expired tokens (no exceptions).
 */
export function verifyRefreshToken(token: string): RefreshTokenPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
      issuer: 'carbonwise',
      audience: 'carbonwise-api',
    }) as RefreshTokenPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Hash a refresh token for secure database storage.
 * Uses SHA-256 — we never store raw refresh tokens.
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Generate a cryptographically secure random token string.
 * Used for password reset tokens.
 */
export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
