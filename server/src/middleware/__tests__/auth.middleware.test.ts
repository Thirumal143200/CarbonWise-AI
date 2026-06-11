jest.mock('../../config/env', () => ({
  env: {
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    AUTH_RATE_LIMIT_MAX_REQUESTS: 100,
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-chars-long',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
  },
}));

import type { Request, Response, NextFunction } from 'express';
import { authMiddleware, optionalAuthMiddleware } from '../auth.middleware';
import * as tokenUtil from '../../utils/token';
import * as responseUtil from '../../utils/response';

jest.mock('../../utils/token');
jest.mock('../../utils/response');
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
  },
}));

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextMock: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {};
    nextMock = jest.fn();
    jest.clearAllMocks();
  });

  describe('authMiddleware', () => {
    it('should send unauthorized if no authorization header is provided', () => {
      authMiddleware(mockRequest as Request, mockResponse as Response, nextMock);

      expect(responseUtil.sendUnauthorized).toHaveBeenCalledWith(
        mockResponse,
        'No authorization header provided'
      );
      expect(nextMock).not.toHaveBeenCalled();
    });

    it('should send unauthorized if authorization header is malformed', () => {
      mockRequest.headers = { authorization: 'BearerOnly' };

      authMiddleware(mockRequest as Request, mockResponse as Response, nextMock);

      expect(responseUtil.sendUnauthorized).toHaveBeenCalledWith(
        mockResponse,
        'Invalid authorization header format. Use: Bearer <token>'
      );
      expect(nextMock).not.toHaveBeenCalled();
    });

    it('should send unauthorized if token verification fails', () => {
      mockRequest.headers = { authorization: 'Bearer badtoken' };
      jest.spyOn(tokenUtil, 'verifyAccessToken').mockReturnValue(null);

      authMiddleware(mockRequest as Request, mockResponse as Response, nextMock);

      expect(tokenUtil.verifyAccessToken).toHaveBeenCalledWith('badtoken');
      expect(responseUtil.sendUnauthorized).toHaveBeenCalledWith(
        mockResponse,
        'Invalid or expired access token'
      );
      expect(nextMock).not.toHaveBeenCalled();
    });

    it('should attach user info and call next on valid token', () => {
      mockRequest.headers = { authorization: 'Bearer goodtoken' };
      const mockPayload = { userId: 'u123', email: 'test@example.com' };
      jest.spyOn(tokenUtil, 'verifyAccessToken').mockReturnValue(mockPayload);

      authMiddleware(mockRequest as Request, mockResponse as Response, nextMock);

      expect(tokenUtil.verifyAccessToken).toHaveBeenCalledWith('goodtoken');
      expect(mockRequest.userId).toBe(mockPayload.userId);
      expect(mockRequest.userEmail).toBe(mockPayload.email);
      expect(nextMock).toHaveBeenCalled();
    });
  });

  describe('optionalAuthMiddleware', () => {
    it('should call next and not attach user info if no header present', () => {
      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextMock);

      expect(mockRequest.userId).toBeUndefined();
      expect(nextMock).toHaveBeenCalled();
    });

    it('should call next and not attach user info if header is malformed', () => {
      mockRequest.headers = { authorization: 'InvalidHeader' };

      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextMock);

      expect(mockRequest.userId).toBeUndefined();
      expect(nextMock).toHaveBeenCalled();
    });

    it('should call next and not attach user info if token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer badtoken' };
      jest.spyOn(tokenUtil, 'verifyAccessToken').mockReturnValue(null);

      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextMock);

      expect(mockRequest.userId).toBeUndefined();
      expect(nextMock).toHaveBeenCalled();
    });

    it('should attach user info on valid token', () => {
      mockRequest.headers = { authorization: 'Bearer goodtoken' };
      const mockPayload = { userId: 'u123', email: 'test@example.com' };
      jest.spyOn(tokenUtil, 'verifyAccessToken').mockReturnValue(mockPayload);

      optionalAuthMiddleware(mockRequest as Request, mockResponse as Response, nextMock);

      expect(mockRequest.userId).toBe(mockPayload.userId);
      expect(mockRequest.userEmail).toBe(mockPayload.email);
      expect(nextMock).toHaveBeenCalled();
    });
  });
});
