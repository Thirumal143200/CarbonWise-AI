import { CATEGORY_ICONS } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, Leaf, Flame, Award, Activity, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

import { api } from '../../lib/api';
import { useAuthStore } from '../../stores/auth.store';

interface DashboardData {
  daily: { totalKg: number; changePercent: number; entryCount: number };
  weekly: { totalKg: number; changePercent: number; entryCount: number };
  monthly: { totalKg: number; changePercent: number; entryCount: number };
  annual: { totalKg: number; changePercent: number; entryCount: number };
  breakdown: { category: string; totalKg: number; percentage: number }[];
  recentEntries: {
    id: string;
    category: string;
    subcategory: string;
    emissionsKg: number;
    entryDate: string;
  }[];
  comparisonWithAverage: { userKg: number; nationalAverageKg: number; percentBelowAverage: number };
}

const PIE_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b'];

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

  const stats = [
    {
      label: 'Today',
      value: data?.daily.totalKg ?? 0,
      change: data?.daily.changePercent ?? 0,
      icon: Activity,
      color: 'from-blue-500 to-blue-600',
    },
    {
      label: 'This Week',
      value: data?.weekly.totalKg ?? 0,
      change: data?.weekly.changePercent ?? 0,
      icon: Flame,
      color: 'from-amber-500 to-orange-600',
    },
    {
      label: 'This Month',
      value: data?.monthly.totalKg ?? 0,
      change: data?.monthly.changePercent ?? 0,
      icon: Leaf,
      color: 'from-emerald-500 to-emerald-600',
    },
    {
      label: 'This Year',
      value: data?.annual.totalKg ?? 0,
      change: data?.annual.changePercent ?? 0,
      icon: Award,
      color: 'from-purple-500 to-purple-600',
    },
  ];

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
      <motion.div
        variants={itemVariants}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="stat-card">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-surface-500 dark:text-surface-400">
                  {stat.label}
                </span>
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}
                >
                  <Icon className="w-5 h-5 text-white" aria-hidden="true" />
                </div>
              </div>
              <div className="flex items-end gap-2">
                <p className="text-2xl font-bold">{stat.value.toFixed(1)}</p>
                <span className="text-sm text-surface-500 mb-0.5">kg CO₂</span>
              </div>
              <div
                className={`flex items-center gap-1 text-sm font-medium ${
                  stat.change <= 0 ? 'text-emerald-600' : 'text-red-500'
                }`}
              >
                {stat.change <= 0 ? (
                  <TrendingDown className="w-4 h-4" aria-hidden="true" />
                ) : (
                  <TrendingUp className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{Math.abs(stat.change)}% vs previous</span>
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Emissions Trend</h2>
          <div
            className="h-72"
            role="img"
            aria-label="Line chart showing daily carbon emissions trend"
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorEmissions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  tickFormatter={(d: string) => (d ? d.slice(5) : '')}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: '12px',
                    border: 'none',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                  }}
                  formatter={(value: number) => [`${value.toFixed(2)} kg`, 'CO₂']}
                />
                <Area
                  type="monotone"
                  dataKey="totalKg"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorEmissions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Category Breakdown */}
        <motion.div variants={itemVariants} className="glass-card p-6">
          <h2 className="text-lg font-semibold mb-4">Category Breakdown</h2>
          <div
            className="h-52"
            role="img"
            aria-label="Pie chart showing carbon emissions by category"
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.breakdown ?? []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  dataKey="totalKg"
                  nameKey="category"
                  paddingAngle={3}
                >
                  {(data?.breakdown ?? []).map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => [`${value.toFixed(2)} kg`, 'CO₂']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-2 mt-2">
            {(data?.breakdown ?? []).map((cat, idx) => (
              <div key={cat.category} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                  />
                  <span className="capitalize">
                    {CATEGORY_ICONS[cat.category] ?? '📊'} {cat.category}
                  </span>
                </div>
                <span className="font-medium">{cat.percentage}%</span>
              </div>
            ))}
          </div>
        </motion.div>
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
