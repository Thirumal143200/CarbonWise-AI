import {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from '@carbonwise/shared';
import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { authRateLimiter } from '../../middleware/rate-limiter.middleware';
import { validate } from '../../middleware/validate.middleware';

import * as authController from './auth.controller';

const router = Router();

// ---- Public routes (rate-limited) ----

router.post('/signup', authRateLimiter, validate(signupSchema), authController.signup);

router.post('/login', authRateLimiter, validate(loginSchema), authController.login);

router.post('/refresh', validate(refreshTokenSchema), authController.refresh);

router.post(
  '/forgot-password',
  authRateLimiter,
  validate(forgotPasswordSchema),
  authController.forgotPassword,
);

router.post(
  '/reset-password',
  authRateLimiter,
  validate(resetPasswordSchema),
  authController.resetPassword,
);

// ---- Protected routes ----

router.get('/me', authMiddleware, authController.getProfile);

router.put('/profile', authMiddleware, validate(updateProfileSchema), authController.updateProfile);

router.post('/logout', authMiddleware, validate(refreshTokenSchema), authController.logout);

export default router;
