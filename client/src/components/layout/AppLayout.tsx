import { Outlet, Navigate } from 'react-router-dom';

import { useAuthStore } from '../../stores/auth.store';

import { Sidebar } from './Sidebar';

/**
 * App shell layout — sidebar + content area.
 * Redirects to login if not authenticated.
 */
export function AppLayout() {
  const { isAuthenticated } = useAuthStore();

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
