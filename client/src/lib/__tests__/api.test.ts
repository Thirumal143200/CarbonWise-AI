// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, ApiError } from '../api';

describe('ApiClient', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    api.setAccessToken(null);
  });

  it('should manage access tokens correctly', () => {
    expect(api.getAccessToken()).toBeNull();
    api.setAccessToken('my-token');
    expect(api.getAccessToken()).toBe('my-token');
  });

  it('should inject headers correctly on request', async () => {
    const mockResponse = {
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'application/json';
          return null;
        },
      },
      json: () => Promise.resolve({ data: { success: true } }),
    };

    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    api.setAccessToken('my-token');
    const result = await api.get('/test-endpoint');

    expect(result).toEqual({ success: true });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('/test-endpoint'),
      expect.objectContaining({
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer my-token',
        }),
      })
    );
  });

  it('should parse non-JSON responses successfully', async () => {
    const mockResponse = {
      ok: true,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'application/pdf';
          return null;
        },
      },
    };

    vi.spyOn(window, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const result = await api.get('/download-report');
    expect(result).toBe(mockResponse);
  });

  it('should throw ApiError on non-JSON response failure', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'application/pdf';
          return null;
        },
      },
    };

    vi.spyOn(window, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    await expect(api.get('/download-report')).rejects.toThrow(ApiError);
  });

  it('should map server API errors to ApiError successfully', async () => {
    const mockErrorResponse = {
      ok: false,
      status: 400,
      headers: {
        get: (name: string) => {
          if (name === 'content-type') return 'application/json';
          return null;
        },
      },
      json: () => Promise.resolve({
        error: {
          message: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: [{ field: 'email', message: 'Invalid email' }],
        },
      }),
    };

    vi.spyOn(window, 'fetch').mockResolvedValue(mockErrorResponse as unknown as Response);

    try {
      await api.post('/some-action', { some: 'data' });
      expect.fail('Should have thrown ApiError');
    } catch (err: any) {
      expect(err).toBeInstanceOf(ApiError);
      expect(err.statusCode).toBe(400);
      expect(err.code).toBe('VALIDATION_ERROR');
      expect(err.message).toBe('Validation failed');
      expect(err.details).toEqual([{ field: 'email', message: 'Invalid email' }]);
    }
  });

  it('should support put and delete verbs', async () => {
    const mockResponse = {
      ok: true,
      headers: {
        get: (_name: string) => 'application/json',
      },
      json: () => Promise.resolve({ data: 'updated' }),
    };

    const fetchSpy = vi.spyOn(window, 'fetch').mockResolvedValue(mockResponse as unknown as Response);

    const putResult = await api.put('/update', { foo: 'bar' });
    expect(putResult).toBe('updated');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'PUT', body: JSON.stringify({ foo: 'bar' }) })
    );

    const deleteResult = await api.delete('/delete');
    expect(deleteResult).toBe('updated');
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ method: 'DELETE' })
    );
  });
});
