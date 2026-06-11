/* eslint-disable @typescript-eslint/unbound-method */
// @vitest-environment jsdom
import './setup';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { PublicUser } from '@carbonwise/shared';
import type * as apiModule from '../../lib/api';
import { useAuthStore } from '../auth.store';
import { api, ApiError } from '../../lib/api';

// Spy or mock api client methods
vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof apiModule>();
  return {
    ...actual,
    api: {
      ...actual.api,
      post: vi.fn(),
      put: vi.fn(),
      setAccessToken: vi.fn(),
    },
  };
});

describe('Auth Store', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset Zustand store state
    useAuthStore.setState({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    vi.clearAllMocks();
  });

  it('should initialize with default empty values', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle successful signup', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com', name: 'User One', level: 1, xp: 0 };
    const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };

    vi.mocked(api.post).mockResolvedValue({ user: mockUser, tokens: mockTokens });

    await useAuthStore.getState().signup('test@example.com', 'Pass123!', 'User One');

    expect(api.post).toHaveBeenCalledWith('/auth/signup', {
      email: 'test@example.com',
      password: 'Pass123!',
      name: 'User One',
    });
    expect(api.setAccessToken).toHaveBeenCalledWith('access');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.isAuthenticated).toBe(true);
    expect(state.isLoading).toBe(false);
  });

  it('should handle failed signup', async () => {
    const apiError = new ApiError('Email already exists', 409, 'CONFLICT');
    vi.mocked(api.post).mockRejectedValue(apiError);

    await expect(
      useAuthStore.getState().signup('test@example.com', 'Pass123!', 'User One')
    ).rejects.toThrow('Email already exists');

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Email already exists');
    expect(state.isAuthenticated).toBe(false);
  });

  it('should handle successful login', async () => {
    const mockUser = { id: 'u1', email: 'test@example.com', name: 'User One', level: 1, xp: 0 };
    const mockTokens = { accessToken: 'access', refreshToken: 'refresh' };

    vi.mocked(api.post).mockResolvedValue({ user: mockUser, tokens: mockTokens });

    await useAuthStore.getState().login('test@example.com', 'Pass123!');

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'Pass123!',
    });
    expect(api.setAccessToken).toHaveBeenCalledWith('access');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.tokens).toEqual(mockTokens);
    expect(state.isAuthenticated).toBe(true);
  });

  it('should handle failed login', async () => {
    const apiError = new ApiError('Invalid credentials', 401, 'UNAUTHORIZED');
    vi.mocked(api.post).mockRejectedValue(apiError);

    await expect(
      useAuthStore.getState().login('test@example.com', 'Pass123!')
    ).rejects.toThrow('Invalid credentials');

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBe('Invalid credentials');
  });

  it('should handle logout', async () => {
    // Setup authenticated state
    useAuthStore.setState({
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
      user: { id: 'u1', email: 'test@example.com', name: 'User One', level: 1, xp: 0 } as unknown as PublicUser,
      isAuthenticated: true,
    });

    vi.mocked(api.post).mockResolvedValue({});

    await useAuthStore.getState().logout();

    expect(api.post).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'refresh' });
    expect(api.setAccessToken).toHaveBeenCalledWith(null);

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should force logout on failed token refresh', async () => {
    useAuthStore.setState({
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
    });

    vi.mocked(api.post).mockRejectedValue(new Error('Refresh expired'));

    await useAuthStore.getState().refreshTokens();

    expect(api.setAccessToken).toHaveBeenCalledWith(null);
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.tokens).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should successfully refresh tokens', async () => {
    useAuthStore.setState({
      tokens: { accessToken: 'access', refreshToken: 'refresh' },
    });

    const newTokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };
    vi.mocked(api.post).mockResolvedValue(newTokens);

    await useAuthStore.getState().refreshTokens();

    expect(api.post).toHaveBeenCalledWith('/auth/refresh', { refreshToken: 'refresh' });
    expect(api.setAccessToken).toHaveBeenCalledWith('new-access');
    expect(useAuthStore.getState().tokens).toEqual(newTokens);
  });

  it('should handle profile updates', async () => {
    useAuthStore.setState({
      user: { id: 'u1', email: 'test@example.com', name: 'Old Name', level: 1, xp: 0 } as unknown as PublicUser,
    });

    const updatedUser = { id: 'u1', email: 'test@example.com', name: 'New Name', level: 1, xp: 0 };
    vi.mocked(api.put).mockResolvedValue({ user: updatedUser });

    await useAuthStore.getState().updateProfile({ name: 'New Name' });

    expect(api.put).toHaveBeenCalledWith('/auth/profile', { name: 'New Name' });
    expect(useAuthStore.getState().user).toEqual(updatedUser);
  });

  it('should clear errors', () => {
    useAuthStore.setState({ error: 'Some error' });
    useAuthStore.getState().clearError();
    expect(useAuthStore.getState().error).toBeNull();
  });

  it('should set user state explicitly', () => {
    const mockUser = { id: 'u1', email: 'test@example.com', name: 'User', level: 1, xp: 0 } as unknown as PublicUser;
    useAuthStore.getState().setUser(mockUser);
    expect(useAuthStore.getState().user).toEqual(mockUser);
  });
});
