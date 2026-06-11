import type { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/logger';
import { sendUnauthorized } from '../utils/response';
import { verifyAccessToken } from '../utils/token';

/**
 * Augment Express Request to include authenticated user info.
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * JWT authentication middleware.
 * Extracts and verifies the Bearer token from the Authorization header.
 * Attaches userId and userEmail to the request for downstream handlers.
 *
 * Security: Rejects requests with missing, malformed, or expired tokens.
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    sendUnauthorized(res, 'No authorization header provided');
    return;
  }

  // Must be "Bearer <token>" format
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    sendUnauthorized(res, 'Invalid authorization header format. Use: Bearer <token>');
    return;
  }

  const token = parts[1]!;
  const payload = verifyAccessToken(token);

  if (!payload) {
    sendUnauthorized(res, 'Invalid or expired access token');
    return;
  }

  // Attach user info to request
  req.userId = payload.userId;
  req.userEmail = payload.email;

  logger.debug({ userId: payload.userId }, 'Authenticated request');
  next();
}

/**
 * Optional auth middleware — doesn't reject unauthenticated requests,
 * but attaches user info if a valid token is present.
 * Useful for public endpoints that show extra data for logged-in users.
 */
export function optionalAuthMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1]!;
      const payload = verifyAccessToken(token);
      if (payload) {
        req.userId = payload.userId;
        req.userEmail = payload.email;
      }
    }
  }

  next();
}
