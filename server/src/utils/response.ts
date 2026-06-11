import type { ApiResponse, ApiErrorResponse, PaginationMeta } from '@carbonwise/shared';
import type { Response } from 'express';

/**
 * Standardized API response helpers.
 * Every response follows the same envelope shape.
 */

export function sendSuccess<T>(res: Response, data: T, statusCode = 200, meta?: PaginationMeta): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta,
    error: null,
  };
  res.status(statusCode).json(response);
}

export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode = 400,
  details?: { field: string; message: string }[],
): void {
  const response: ApiErrorResponse = {
    success: false,
    data: null,
    error: {
      code,
      message,
      details,
    },
  };
  res.status(statusCode).json(response);
}

export function sendNotFound(res: Response, resource = 'Resource'): void {
  sendError(res, 'NOT_FOUND', `${resource} not found`, 404);
}

export function sendUnauthorized(res: Response, message = 'Unauthorized'): void {
  sendError(res, 'UNAUTHORIZED', message, 401);
}

export function sendForbidden(res: Response, message = 'Forbidden'): void {
  sendError(res, 'FORBIDDEN', message, 403);
}

export function sendConflict(res: Response, message: string): void {
  sendError(res, 'CONFLICT', message, 409);
}

export function sendRateLimited(res: Response): void {
  sendError(res, 'RATE_LIMITED', 'Too many requests. Please try again later.', 429);
}
