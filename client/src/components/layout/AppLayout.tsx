import { useEffect, useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';

import { useAuthStore } from '../../stores/auth.store';

import { Sidebar } from './Sidebar';

/**
 * App shell layout — sidebar + content area.
 * Waits for Zustand rehydration before evaluating auth state,
 * then redirects to login if not authenticated.
 */
export function AppLayout() {
  const { isAuthenticated } = useAuthStore();
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    // Zustand persist exposes onFinishHydration via the persist API
    const unsub = useAuthStore.persist.onFinishHydration(() => {
      setHasHydrated(true);
    });

    // If already hydrated (e.g. sync storage or fast load), set immediately
    if (useAuthStore.persist.hasHydrated()) {
      setHasHydrated(true);
    }

    return unsub;
  }, []);

  // Show a loading spinner until Zustand has finished restoring state from localStorage
  if (!hasHydrated) {
    return (
      <div
        className="flex items-center justify-center h-screen bg-surface-50 dark:bg-surface-950"
        role="status"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        <span className="sr-only">Loading session...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
      {/* Skip to content link (accessibility) */}
      <a href="#main-content" className="skip-to-content">
        Skip to main content
      </a>

      <Sidebar />

      <main
        id="main-content"
        className="flex-1 overflow-y-auto p-4 lg:p-8"
        role="main"
        tabIndex={-1}
      >
        <div className="max-w-7xl mx-auto animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
