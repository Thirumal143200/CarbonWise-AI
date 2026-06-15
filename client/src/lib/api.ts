import type { ApiResponse, ApiErrorResponse } from '@carbonwise/shared';

const API_BASE =
  (import.meta.env as Record<string, string | undefined>).VITE_API_URL ||
  'http://localhost:3001/api/v1';

/**
 * Type-safe API client with automatic token management.
 * Handles access token injection, 401 refresh with retry, and error parsing.
 *
 * Key features:
 * - Centralized token manager (in-memory accessToken + refresh callback)
 * - Automatic 401 interception → refresh → retry (once)
 * - Queue concurrent requests during a refresh to avoid duplicate refresh calls
 * - Rehydration-aware: waits for Zustand persist to restore tokens before first request
 */

type RefreshFunction = () => Promise<string | null>;

class ApiClient {
  private accessToken: string | null = null;
  private refreshFn: RefreshFunction | null = null;

  // Prevents multiple concurrent refresh calls
  private refreshPromise: Promise<string | null> | null = null;

  // Rehydration gate: resolves once Zustand persist has restored tokens
  private rehydrated = false;
  private rehydrateResolve: (() => void) | null = null;
  private rehydratePromise: Promise<void>;

  constructor() {
    this.rehydratePromise = new Promise<void>((resolve) => {
      this.rehydrateResolve = resolve;
    });
  }

  /** Called by Zustand onRehydrateStorage to set initial token and unblock requests */
  markRehydrated(token: string | null): void {
    this.accessToken = token;
    this.rehydrated = true;
    if (this.rehydrateResolve) {
      this.rehydrateResolve();
      this.rehydrateResolve = null;
    }
  }

  setAccessToken(token: string | null): void {
    this.accessToken = token;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  /**
   * Register a callback that performs the refresh-token exchange.
   * Returns the new access token, or null if refresh failed.
   */
  setRefreshFunction(fn: RefreshFunction): void {
    this.refreshFn = fn;
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

  /**
   * Attempt to refresh the access token. Deduplicates concurrent calls.
   * Returns the new access token or null.
   */
  private async tryRefresh(): Promise<string | null> {
    if (!this.refreshFn) return null;

    // If a refresh is already in-flight, wait for it
    if (this.refreshPromise !== null) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.refreshFn().finally(() => {
      this.refreshPromise = null;
    });

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    // Wait for Zustand rehydration before first request
    if (!this.rehydrated) {
      await this.rehydratePromise;
    }

    const url = `${API_BASE}${endpoint}`;

    const doFetch = async (): Promise<Response> => {
      return fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...(options.headers as Record<string, string> | undefined),
        },
      });
    };

    let response = await doFetch();

    // --- 401 Interceptor: auto-refresh and retry once ---
    const bypassAuthEndpoints = [
      '/auth/login',
      '/auth/signup',
      '/auth/refresh',
      '/auth/forgot-password',
      '/auth/reset-password',
    ];
    if (response.status === 401 && this.refreshFn && !bypassAuthEndpoints.includes(endpoint)) {
      const newToken = await this.tryRefresh();
      if (newToken) {
        // Retry the original request with the fresh token
        response = await doFetch();
      }
    }

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
