import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Leaf,
  Target,
  Trophy,
  BookOpen,
  Brain,
  TrendingUp,
  Users,
  Zap,
  FileText,
  Menu,
  X,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
} from 'lucide-react';
import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { useAuthStore } from '../../stores/auth.store';
import { useThemeStore } from '../../stores/theme.store';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/carbon', label: 'Carbon Log', icon: Leaf },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/predictions', label: 'Forecast', icon: TrendingUp },
  { path: '/twin', label: 'Sustainability Twin', icon: Users },
  { path: '/simulator', label: 'Simulator', icon: Zap },
  { path: '/challenges', label: 'Challenges', icon: Trophy },
  { path: '/ai-coach', label: 'AI Coach', icon: Brain },
  { path: '/education', label: 'Learn', icon: BookOpen },
  { path: '/reports', label: 'Reports', icon: FileText },
];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-5 border-b border-surface-200 dark:border-surface-700">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-carbon-600 flex items-center justify-center shadow-glow">
          <Leaf className="w-6 h-6 text-white" aria-hidden="true" />
        </div>
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <h1 className="text-lg font-bold gradient-text">CarbonWise</h1>
            <p className="text-xs text-surface-500 dark:text-surface-400">
              AI Carbon Intelligence
            </p>
          </motion.div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hidden" aria-label="Main navigation">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={isActive ? 'nav-link-active' : 'nav-link'}
              onClick={() => setIsMobileOpen(false)}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="px-3 py-4 border-t border-surface-200 dark:border-surface-700 space-y-2">
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="nav-link w-full"
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? (
            <Sun className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Moon className="w-5 h-5" aria-hidden="true" />
          )}
          {!isCollapsed && <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>}
        </button>

        {/* User Info */}
        {user && !isCollapsed && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-100 dark:bg-surface-800">
            <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-bold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-surface-500 truncate">Level {user.level}</p>
            </div>
          </div>
        )}

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="nav-link w-full text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          aria-label="Log out"
        >
          <LogOut className="w-5 h-5" aria-hidden="true" />
          {!isCollapsed && <span>Log Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-4 left-4 z-50 lg:hidden btn-icon bg-white dark:bg-surface-800 shadow-card"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            onClick={() => setIsMobileOpen(false)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.aside
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 z-50 w-72 h-screen bg-white dark:bg-surface-900 shadow-xl lg:hidden"
            role="navigation"
            aria-label="Mobile navigation"
          >
            <button
              className="absolute top-4 right-4 btn-icon"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col h-screen bg-white dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-72'
        }`}
        role="navigation"
        aria-label="Desktop navigation"
      >
        <button
          className="absolute top-6 -right-3 z-10 w-6 h-6 rounded-full bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 shadow-sm flex items-center justify-center hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            className={`w-3 h-3 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
          />
        </button>
        {sidebarContent}
      </aside>
    </>
  );
}
