import type { PublicUser, AuthTokens } from '@carbonwise/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { api, ApiError } from '../lib/api';

interface AuthState {
  user: PublicUser | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  signup: (email: string, password: string, name: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshTokens: () => Promise<void>;
  updateProfile: (updates: {
    name?: string;
    avatarUrl?: string;
    leaderboardOptIn?: boolean;
  }) => Promise<void>;
  clearError: () => void;
  setUser: (user: PublicUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      signup: async (email, password, name) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{ user: PublicUser; tokens: AuthTokens }>('/auth/signup', {
            email,
            password,
            name,
          });
          api.setAccessToken(data.tokens.accessToken);
          set({ user: data.user, tokens: data.tokens, isAuthenticated: true, isLoading: false });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Signup failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.post<{ user: PublicUser; tokens: AuthTokens }>('/auth/login', {
            email,
            password,
          });
          api.setAccessToken(data.tokens.accessToken);
          set({ user: data.user, tokens: data.tokens, isAuthenticated: true, isLoading: false });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Login failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      logout: async () => {
        const { tokens } = get();
        try {
          if (tokens?.refreshToken) {
            await api.post('/auth/logout', { refreshToken: tokens.refreshToken });
          }
        } catch {
          // Ignore logout errors
        }
        api.setAccessToken(null);
        set({ user: null, tokens: null, isAuthenticated: false, error: null });
      },

      refreshTokens: async () => {
        const { tokens } = get();
        if (!tokens?.refreshToken) return;

        try {
          const data = await api.post<AuthTokens>('/auth/refresh', {
            refreshToken: tokens.refreshToken,
          });
          api.setAccessToken(data.accessToken);
          set({ tokens: data });
        } catch {
          // Refresh failed — force logout
          api.setAccessToken(null);
          set({ user: null, tokens: null, isAuthenticated: false });
        }
      },

      updateProfile: async (updates) => {
        set({ isLoading: true, error: null });
        try {
          const data = await api.put<{ user: PublicUser }>('/auth/profile', updates);
          set({ user: data.user, isLoading: false });
        } catch (err) {
          const message = err instanceof ApiError ? err.message : 'Update failed';
          set({ isLoading: false, error: message });
          throw err;
        }
      },

      clearError: () => set({ error: null }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'carbonwise-auth',
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Restore access token to API client after rehydration and unblock the request gate
        const token = state?.tokens?.accessToken ?? null;
        api.markRehydrated(token);

        // Wire up the refresh function so the API client can auto-refresh on 401
        api.setRefreshFunction(async (): Promise<string | null> => {
          const currentState = useAuthStore.getState();
          const refreshToken = currentState.tokens?.refreshToken;
          if (!refreshToken) return null;

          try {
            // Direct fetch to avoid going through the interceptor (prevents infinite loop)
            const API_BASE =
              (import.meta.env as Record<string, string | undefined>).VITE_API_URL ||
              'http://localhost:3001/api/v1';
            const response = await fetch(`${API_BASE}/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
            });

            if (!response.ok) {
              // Refresh failed — force logout
              api.setAccessToken(null);
              useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
              return null;
            }

            const json = (await response.json()) as { data: AuthTokens };
            const newTokens = json.data;

            api.setAccessToken(newTokens.accessToken);
            useAuthStore.setState({ tokens: newTokens });

            return newTokens.accessToken;
          } catch {
            // Network failure during refresh — force logout
            api.setAccessToken(null);
            useAuthStore.setState({ user: null, tokens: null, isAuthenticated: false });
            return null;
          }
        });
      },
    },
  ),
);
