import { motion } from 'framer-motion';
import { Leaf, Award, Activity, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';
import { CategoryBreakdownChart } from './components/CategoryBreakdownChart';
import { DashboardStats } from './components/DashboardStats';
import { EmissionsTrendChart } from './components/EmissionsTrendChart';
import type { DashboardData } from './types';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<DashboardData | null>(null);
  const [trendData, setTrendData] = useState<{ date: string; totalKg: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [overview, trends] = await Promise.all([
          api.get<DashboardData>('/dashboard/overview'),
          api.get<{ dataPoints: { date: string; totalKg: number }[] }>(
            '/dashboard/trends?period=monthly',
          ),
        ]);
        setData(overview);
        setTrendData(trends.dataPoints);
      } catch (err) {
        console.error('Dashboard fetch failed:', err);
      } finally {
        setLoading(false);
      }
    }
    void fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center h-96"
        role="status"
        aria-label="Loading dashboard"
      >
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        <span className="sr-only">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-surface-900 dark:text-surface-100">
          Welcome back, <span className="gradient-text">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-surface-500 dark:text-surface-400 mt-1">
          Here&apos;s your carbon footprint overview
        </p>
      </motion.div>

      {/* Stats Cards */}
      <DashboardStats data={data} />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <EmissionsTrendChart trendData={trendData} />

        {/* Category Breakdown */}
        <CategoryBreakdownChart data={data} />
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          to="/carbon"
          className="gradient-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            <Leaf className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">Log Activity</p>
            <p className="text-sm text-surface-500">Track your carbon</p>
          </div>
          <ArrowRight className="w-5 h-5 text-surface-400 group-hover:text-emerald-500 transition-colors" />
        </Link>

        <Link
          to="/simulator"
          className="gradient-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
            <Activity className="w-6 h-6 text-purple-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">What If?</p>
            <p className="text-sm text-surface-500">Simulate actions</p>
          </div>
          <ArrowRight className="w-5 h-5 text-surface-400 group-hover:text-purple-500 transition-colors" />
        </Link>

        <Link
          to="/ai-coach"
          className="gradient-card p-5 flex items-center gap-4 hover:shadow-card-hover transition-all group"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
            <Award className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">AI Coach</p>
            <p className="text-sm text-surface-500">Get insights</p>
          </div>
          <ArrowRight className="w-5 h-5 text-surface-400 group-hover:text-blue-500 transition-colors" />
        </Link>
      </motion.div>
    </motion.div>
  );
}
