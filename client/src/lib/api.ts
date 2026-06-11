import type { ApiResponse, ApiErrorResponse } from '@carbonwise/shared';

const API_BASE = (import.meta.env as Record<string, string | undefined>).VITE_API_URL || 'http://localhost:3001/api/v1';

/**
 * Type-safe API client with automatic token management.
 * Handles access token injection, 401 refresh, and error parsing.
 */

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  private getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }
    return headers;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...(options.headers as Record<string, string> | undefined),
      },
    });

    // Handle non-JSON responses (PDF downloads, etc.)
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new ApiError('Request failed', response.status, 'SERVER_ERROR');
      }
      return response as unknown as T;
    }

    const data: unknown = await response.json();

    if (!response.ok) {
      const errorResponse = data as ApiErrorResponse;
      throw new ApiError(
        errorResponse.error.message,
        response.status,
        errorResponse.error.code,
        errorResponse.error.details,
      );
    }

    return (data as ApiResponse<T>).data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export class ApiError extends Error {
  public statusCode: number;
  public code: string;
  public details?: { field: string; message: string }[];

  constructor(
    message: string,
    statusCode: number,
    code: string,
    details?: { field: string; message: string }[],
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export const api = new ApiClient();
