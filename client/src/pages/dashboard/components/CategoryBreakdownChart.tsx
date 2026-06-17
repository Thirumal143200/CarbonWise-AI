import { CATEGORY_ICONS } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import type { DashboardData } from '../types';

interface CategoryBreakdownChartProps {
  data: DashboardData | null;
}

const PIE_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#8b5cf6', '#f59e0b'];

export function CategoryBreakdownChart({ data }: CategoryBreakdownChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
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
  );
}
