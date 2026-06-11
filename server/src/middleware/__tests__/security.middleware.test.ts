import type { Request, Response, NextFunction } from 'express';
import { securityHeaders } from '../security.middleware';

describe('Security Middleware', () => {
  it('should execute helmet middleware and call next', () => {
    const mockRequest = {
      headers: {},
      method: 'GET',
    } as Partial<Request>;
    const mockResponse = {
      setHeader: jest.fn(),
      removeHeader: jest.fn(),
    } as any;
    const nextMock = jest.fn() as NextFunction;

    securityHeaders(mockRequest as Request, mockResponse as Response, nextMock);

    expect(nextMock).toHaveBeenCalled();
  });
});
