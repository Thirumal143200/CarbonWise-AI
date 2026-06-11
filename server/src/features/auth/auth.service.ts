import type { PublicUser, AuthResponse } from '@carbonwise/shared';
import bcrypt from 'bcrypt';
import { Resend } from 'resend';
import { v4 as uuidv4 } from 'uuid';

import { env, isEmailAvailable } from '../../config/env';
import { AppError } from '../../middleware/error-handler.middleware';
import { logger } from '../../utils/logger';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRandomToken,
} from '../../utils/token';

import * as authRepo from './auth.repository';
import type { UserRow } from './auth.repository';


const BCRYPT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Auth service — business logic layer.
 * Orchestrates auth flows without knowing about HTTP.
 */

// ---- Helpers ----

function toPublicUser(row: UserRow): PublicUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    avatarUrl: row.avatar_url,
    ecoScore: row.eco_score,
    xp: row.xp,
    level: row.level,
    leaderboardOptIn: row.leaderboard_opt_in,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

async function createTokenPair(userId: string, email: string) {
  const tokenId = uuidv4();

  const accessToken = generateAccessToken({ userId, email });
  const refreshToken = generateRefreshToken({ userId, tokenId });

  // Store hashed refresh token in DB
  const refreshExpiry = new Date();
  refreshExpiry.setDate(refreshExpiry.getDate() + 7);
  await authRepo.storeRefreshToken(userId, hashToken(refreshToken), refreshExpiry);

  return { accessToken, refreshToken };
}

// ---- Service Methods ----

export async function signup(
  email: string,
  password: string,
  name: string,
): Promise<AuthResponse> {
  // Check if user already exists
  const existing = await authRepo.findUserByEmail(email);
  if (existing) {
    throw new AppError(409, 'CONFLICT', 'An account with this email already exists');
  }

  // Hash password with bcrypt (cost factor 12)
  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const userRow = await authRepo.createUser(email, passwordHash, name);
  const tokens = await createTokenPair(userRow.id, userRow.email);

  logger.info({ userId: userRow.id }, 'User signed up');

  return {
    user: toPublicUser(userRow),
    tokens,
  };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  // Find user by email
  const userRow = await authRepo.findUserByEmail(email);
  if (!userRow) {
    // Use same error message for email not found and wrong password
    // to prevent user enumeration
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  // Verify password
  const isValid = await bcrypt.compare(password, userRow.password_hash);
  if (!isValid) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid email or password');
  }

  const tokens = await createTokenPair(userRow.id, userRow.email);

  logger.info({ userId: userRow.id }, 'User logged in');

  return {
    user: toPublicUser(userRow),
    tokens,
  };
}

export async function refreshTokens(
  refreshTokenStr: string,
): Promise<{ accessToken: string; refreshToken: string }> {
  // Verify the refresh token JWT
  const payload = verifyRefreshToken(refreshTokenStr);
  if (!payload) {
    throw new AppError(401, 'UNAUTHORIZED', 'Invalid or expired refresh token');
  }

  // Find the hashed token in DB
  const tokenHash = hashToken(refreshTokenStr);
  const storedToken = await authRepo.findRefreshToken(tokenHash);
  if (!storedToken) {
    // Token not found or revoked — possible replay attack
    // Revoke ALL tokens for this user as a security measure
    logger.warn({ userId: payload.userId }, 'Refresh token reuse detected — revoking all tokens');
    await authRepo.revokeAllUserRefreshTokens(payload.userId);
    throw new AppError(401, 'UNAUTHORIZED', 'Refresh token has been revoked');
  }

  // Rotate: revoke old token and issue new pair
  await authRepo.revokeRefreshToken(tokenHash);

  const user = await authRepo.findUserById(payload.userId);
  if (!user) {
    throw new AppError(401, 'UNAUTHORIZED', 'User not found');
  }

  return createTokenPair(user.id, user.email);
}

export async function forgotPassword(email: string): Promise<void> {
  const user = await authRepo.findUserByEmail(email);

  // Always return success to prevent user enumeration
  if (!user) {
    logger.debug({ email }, 'Forgot password for non-existent email');
    return;
  }

  // Generate reset token
  const rawToken = generateRandomToken();
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

  await authRepo.storePasswordResetToken(user.id, tokenHash, expiresAt);

  // Send email
  if (isEmailAvailable()) {
    const resend = new Resend(env.RESEND_API_KEY);
    const resetUrl = `${env.CORS_ORIGIN}/reset-password?token=${rawToken}`;

    try {
      await resend.emails.send({
        from: env.EMAIL_FROM,
        to: email,
        subject: 'CarbonWise — Reset Your Password',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10b981;">CarbonWise</h2>
            <p>Hi ${user.name},</p>
            <p>You requested a password reset. Click the link below to set a new password:</p>
            <p>
              <a href="${resetUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">
                Reset Password
              </a>
            </p>
            <p style="color: #666; font-size: 14px;">
              This link expires in ${RESET_TOKEN_EXPIRY_HOURS} hour.
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      logger.info({ userId: user.id }, 'Password reset email sent');
    } catch (err) {
      logger.error({ err, userId: user.id }, 'Failed to send password reset email');
      // Don't throw — don't reveal email service status to client
    }
  } else {
    // Dev mode: log the reset link
    logger.info(
      { userId: user.id, resetToken: rawToken },
      'Password reset token generated (email service unavailable)',
    );
  }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  const tokenHash = hashToken(token);
  const resetToken = await authRepo.findPasswordResetToken(tokenHash);

  if (!resetToken) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Invalid or expired reset token');
  }

  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

  // Update password and mark token as used
  await authRepo.updateUserPassword(resetToken.user_id, passwordHash);
  await authRepo.markPasswordResetTokenUsed(tokenHash);

  // Revoke all refresh tokens (force re-login everywhere)
  await authRepo.revokeAllUserRefreshTokens(resetToken.user_id);

  logger.info({ userId: resetToken.user_id }, 'Password reset successfully');
}

export async function getProfile(userId: string): Promise<PublicUser> {
  const user = await authRepo.findUserById(userId);
  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }
  return toPublicUser(user);
}

export async function updateProfile(
  userId: string,
  updates: { name?: string; avatarUrl?: string; leaderboardOptIn?: boolean },
): Promise<PublicUser> {
  const user = await authRepo.updateUser(userId, {
    name: updates.name,
    avatar_url: updates.avatarUrl,
    leaderboard_opt_in: updates.leaderboardOptIn,
  });

  if (!user) {
    throw new AppError(404, 'NOT_FOUND', 'User not found');
  }

  return toPublicUser(user);
}

export async function logout(refreshTokenStr: string): Promise<void> {
  const tokenHash = hashToken(refreshTokenStr);
  await authRepo.revokeRefreshToken(tokenHash);
}
