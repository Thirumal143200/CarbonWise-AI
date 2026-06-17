import type { SustainabilityTwin } from '@carbonwise/shared';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface PriorityActionsProps {
  gapAnalysis: SustainabilityTwin['gapAnalysis'];
}

export function PriorityActions({ gapAnalysis }: PriorityActionsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Priority Actions */}
      <div className="lg:col-span-2 glass-card p-6 md:p-8 space-y-6">
        <div>
          <h3 className="text-xl font-bold">Priority Sustainability Actions</h3>
          <p className="text-sm text-surface-500 mt-1">
            Top steps you can take today to narrow the gap between you and your twin.
          </p>
        </div>

        <div className="space-y-4">
          {gapAnalysis.priorityActions.map((action) => (
            <div
              key={action.rank}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-200/50 dark:border-surface-700/50"
            >
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold mt-0.5">
                  {action.rank}
                </span>
                <div>
                  <h4 className="font-semibold text-sm">{action.action}</h4>
                  <p className="text-xs text-surface-500 mt-0.5">Category: {action.category}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-center">
                <span className="text-xs bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded">
                  -{action.impactKgPerWeek.toFixed(1)} kg/wk
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded font-semibold capitalize ${
                    action.difficulty === 'easy'
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                      : action.difficulty === 'medium'
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                      : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                  }`}
                >
                  {action.difficulty} Effort
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gap Breakdown summary */}
      <div className="glass-card p-6 md:p-8 space-y-6">
        <h3 className="text-xl font-bold">Category Gap Analysis</h3>

        <div className="space-y-4">
          {gapAnalysis.categories.map((c) => {
            const hasGap = c.gapKg > 0;
            return (
              <div
                key={c.category}
                className="flex items-start justify-between p-3 rounded-xl bg-surface-50 dark:bg-surface-800/30"
              >
                <div>
                  <p className="font-semibold text-sm">{c.category}</p>
                  {hasGap ? (
                    <p className="text-xs text-amber-500 font-medium">
                      Gap of {c.gapKg.toFixed(1)} kg ({c.gapPercent}%)
                    </p>
                  ) : (
                    <p className="text-xs text-emerald-500 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Aligning perfectly!
                    </p>
                  )}
                </div>
                {hasGap && (
                  <span className="text-xs text-surface-500 font-medium">
                    {c.currentKg.toFixed(0)} vs {c.idealKg.toFixed(0)} kg
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-surface-200 dark:border-surface-700">
          <a
            href="/simulator"
            className="w-full btn-secondary flex items-center justify-center gap-2 py-2.5 text-sm"
          >
            <span>Simulate Twin Actions</span>
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
}
