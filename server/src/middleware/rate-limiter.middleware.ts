import rateLimit from 'express-rate-limit';

import { env } from '../config/env';
import { sendRateLimited } from '../utils/response';

/**
 * General API rate limiter — 100 requests per 15 minutes per IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  handler: (_req, res) => {
    sendRateLimited(res);
  },
  keyGenerator: (req) => {
    // Use X-Forwarded-For in production (behind reverse proxy)
    return (req.ip ?? req.socket.remoteAddress ?? 'unknown');
  },
});

/**
 * Strict rate limiter for auth endpoints — 5 attempts per 15 minutes per IP.
 * Prevents brute-force attacks on login/signup/password-reset.
 */
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, res) => {
    sendRateLimited(res);
  },
  keyGenerator: (req) => {
    return (req.ip ?? req.socket.remoteAddress ?? 'unknown');
  },
  skipSuccessfulRequests: false,
});
