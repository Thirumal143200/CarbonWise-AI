// @vitest-environment jsdom
import './setup';
import { describe, it, expect, beforeEach } from 'vitest';
import { useThemeStore } from '../theme.store';

describe('Theme Store', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    // Reset Zustand store state manually
    useThemeStore.setState({ isDark: false });
  });

  it('should initialize with light mode by default if media query is false and no localStorage', () => {
    const state = useThemeStore.getState();
    expect(state.isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should toggle theme state', () => {
    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('carbonwise-theme')).toBe('dark');

    useThemeStore.getState().toggle();
    expect(useThemeStore.getState().isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('carbonwise-theme')).toBe('light');
  });

  it('should set dark mode state explicitly', () => {
    useThemeStore.getState().setDark(true);
    expect(useThemeStore.getState().isDark).toBe(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    expect(localStorage.getItem('carbonwise-theme')).toBe('dark');

    useThemeStore.getState().setDark(false);
    expect(useThemeStore.getState().isDark).toBe(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
    expect(localStorage.getItem('carbonwise-theme')).toBe('light');
  });
});
