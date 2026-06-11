import type { Request, Response } from 'express';

import { asyncHandler } from '../../middleware/error-handler.middleware';
import { sendSuccess, sendCreated } from '../../utils/response';

import * as authService from './auth.service';

/**
 * Auth controller — thin HTTP layer.
 * Extracts request data, calls service, sends response.
 * All input validation handled by middleware (validate.middleware).
 */

export const signup = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password, name } = req.body as { email: string; password: string; name: string };
  const result = await authService.signup(email, password, name);
  sendCreated(res, result);
});

export const login = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body as { email: string; password: string };
  const result = await authService.login(email, password);
  sendSuccess(res, result);
});

export const refresh = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  const tokens = await authService.refreshTokens(refreshToken);
  sendSuccess(res, tokens);
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body as { email: string };
  await authService.forgotPassword(email);
  // Always return success to prevent user enumeration
  sendSuccess(res, { message: 'If an account exists with this email, a reset link has been sent.' });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body as { token: string; newPassword: string };
  await authService.resetPassword(token, newPassword);
  sendSuccess(res, { message: 'Password reset successfully. Please log in with your new password.' });
});

export const getProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const user = await authService.getProfile(userId);
  sendSuccess(res, { user });
});

export const updateProfile = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const updates = req.body as { name?: string; avatarUrl?: string; leaderboardOptIn?: boolean };
  const user = await authService.updateProfile(userId, updates);
  sendSuccess(res, { user });
});

export const logout = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { refreshToken } = req.body as { refreshToken: string };
  await authService.logout(refreshToken);
  sendSuccess(res, { message: 'Logged out successfully' });
});
