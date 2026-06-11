import type { Request, Response, NextFunction } from 'express';

import { logger } from '../utils/logger';
import { sendError } from '../utils/response';

/**
 * Application-level error class with HTTP status codes.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: string,
    message: string,
    public readonly details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'AppError';
    // Ensure proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handler middleware.
 * Must be registered LAST in the middleware chain.
 *
 * - Catches all unhandled errors from route handlers
 * - Logs full error details (never exposes internal errors to client)
 * - Returns consistent error envelope
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Known application errors
  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, err.message);
    sendError(res, err.code, err.message, err.statusCode, err.details);
    return;
  }

  // Unexpected errors — log full stack, return generic message
  logger.error({ err }, 'Unhandled error');
  sendError(
    res,
    'INTERNAL_ERROR',
    'An unexpected error occurred. Please try again later.',
    500,
  );
}

/**
 * Async route handler wrapper.
 * Catches promise rejections and forwards to the error handler.
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
