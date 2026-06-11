// @vitest-environment jsdom
import '../../../stores/__tests__/setup';
import { describe, it, expect, vi } from 'vitest';
import { AppLayout } from '../AppLayout';
import { useAuthStore } from '../../../stores/auth.store';

// Mock useAuthStore
vi.mock('../../../stores/auth.store', () => ({
  useAuthStore: vi.fn(),
}));

describe('AppLayout Component (Unit)', () => {
  it('should return Navigate element if not authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: false,
    } as any);

    const result = AppLayout() as any;
    expect(result).not.toBeNull();
    expect(result.type).toBeDefined();
    // Verify it returns Navigate element properties
    expect(result.props.to).toBe('/login');
    expect(result.props.replace).toBe(true);
  });

  it('should return layout div element if authenticated', () => {
    vi.mocked(useAuthStore).mockReturnValue({
      isAuthenticated: true,
    } as any);

    const result = AppLayout() as any;
    expect(result).not.toBeNull();
    expect(result.type).toBe('div');
    expect(result.props.className).toContain('flex h-screen');
  });
});
