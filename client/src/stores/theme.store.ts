import { create } from 'zustand';

interface ThemeState {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeState>()((set) => {
  // Initialize from localStorage or system preference
  const stored = localStorage.getItem('carbonwise-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initial = stored ? stored === 'dark' : prefersDark;

  // Apply immediately
  if (initial) {
    document.documentElement.classList.add('dark');
  }

  return {
    isDark: initial,

    toggle: () => {
      set((state) => {
        const newDark = !state.isDark;
        document.documentElement.classList.toggle('dark', newDark);
        localStorage.setItem('carbonwise-theme', newDark ? 'dark' : 'light');
        return { isDark: newDark };
      });
    },

    setDark: (dark) => {
      document.documentElement.classList.toggle('dark', dark);
      localStorage.setItem('carbonwise-theme', dark ? 'dark' : 'light');
      set({ isDark: dark });
    },
  };
});
