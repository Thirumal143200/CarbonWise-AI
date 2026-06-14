// @vitest-environment jsdom
import '../../../stores/__tests__/setup';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore } from '../../../stores/auth.store';

// Mock useAuthStore with persist API
vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: Object.assign(vi.fn(), {
    persist: {
      onFinishHydration: vi.fn(() => () => {}),
      hasHydrated: vi.fn(() => true),
    },
  }),
}));

// Track state setter calls
let hasHydratedValue = true;
vi.mock('react', async () => {
  const actual = await vi.importActual<Record<string, unknown>>('react');
  return {
    ...actual,
    useState: (init: unknown): [unknown, any] => {
      // For boolean (hasHydrated state), return controlled value
      if (init === false) {
        return [
          hasHydratedValue,
          vi.fn((v: boolean) => {
            hasHydratedValue = v;
          }),
        ];
      }
      return [init, vi.fn()];
    },
    useEffect: (fn: () => void) => {
      fn();
    },
  };
});

import { AppLayout } from '../AppLayout';

describe('AppLayout Component (Unit)', () => {
  beforeEach(() => {
    hasHydratedValue = true; // reset
  });

  it('should return Navigate element if not authenticated and hydrated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
    } as any);
    vi.mocked(useAuthStore.persist.hasHydrated).mockReturnValue(true);

    const result = AppLayout() as any;
    expect(result).not.toBeNull();
    expect(result.type).toBeDefined();
    // Navigate component has props.to and props.replace
    expect(result.props.to).toBe('/login');
    expect(result.props.replace).toBe(true);
  });

  it('should return layout div element if authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
    } as any);
    vi.mocked(useAuthStore.persist.hasHydrated).mockReturnValue(true);

    const result = AppLayout() as any;
    expect(result).not.toBeNull();
    expect(result.type).toBe('div');
    expect(result.props.className).toContain('flex h-screen');
  });
});
