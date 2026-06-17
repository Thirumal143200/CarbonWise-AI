import { Activity, Flame, Leaf, Award, TrendingDown, TrendingUp } from 'lucide-react';
import type { DashboardData } from '../types';

interface DashboardStatsProps {
  data: DashboardData | null;
}

export function DashboardStats({ data }: DashboardStatsProps) {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  );
}
