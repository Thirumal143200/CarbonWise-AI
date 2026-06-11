import type { Response } from 'express';
import * as responseUtil from '../response';

describe('Response Enveloper Utilities', () => {
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockImplementation(() => mockResponse);
    mockResponse = {
      status: statusMock,
      json: jsonMock,
    };
  });

  it('should send standard success envelope (200 OK)', () => {
    const data = { items: [1, 2] };
    const meta = { total: 2, page: 1, limit: 10, totalPages: 1 };
    
    responseUtil.sendSuccess(mockResponse as Response, data, 200, meta);

    expect(statusMock).toHaveBeenCalledWith(200);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data,
      meta,
      error: null,
    });
  });

  it('should send standard created envelope (201 Created)', () => {
    const data = { id: 'new-id' };
    
    responseUtil.sendCreated(mockResponse as Response, data);

    expect(statusMock).toHaveBeenCalledWith(201);
    expect(jsonMock).toHaveBeenCalledWith({
      success: true,
      data,
      meta: undefined,
      error: null,
    });
  });

  it('should send standard error envelope', () => {
    const details = [{ field: 'email', message: 'Invalid format' }];
    
    responseUtil.sendError(mockResponse as Response, 'VALIDATION_ERROR', 'Validation failed', 400, details);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({
      success: false,
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    });
  });

  it('should send unauthorized (401)', () => {
    responseUtil.sendUnauthorized(mockResponse as Response, 'Expired token');

    expect(statusMock).toHaveBeenCalledWith(401);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Expired token',
          details: undefined,
        },
      })
    );
  });

  it('should send forbidden (403)', () => {
    responseUtil.sendForbidden(mockResponse as Response, 'Access denied');

    expect(statusMock).toHaveBeenCalledWith(403);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'FORBIDDEN',
          message: 'Access denied',
        }),
      })
    );
  });

  it('should send not found (404)', () => {
    responseUtil.sendNotFound(mockResponse as Response, 'User');

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'NOT_FOUND',
          message: 'User not found',
        }),
      })
    );
  });

  it('should send conflict (409)', () => {
    responseUtil.sendConflict(mockResponse as Response, 'Email in use');

    expect(statusMock).toHaveBeenCalledWith(409);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'CONFLICT',
          message: 'Email in use',
        }),
      })
    );
  });

  it('should send rate limited (429)', () => {
    responseUtil.sendRateLimited(mockResponse as Response);

    expect(statusMock).toHaveBeenCalledWith(429);
    expect(jsonMock).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.objectContaining({
          code: 'RATE_LIMITED',
          message: 'Too many requests. Please try again later.',
        }),
      })
    );
  });
});
