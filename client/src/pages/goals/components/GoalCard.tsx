import type { Goal } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import { Calendar, Percent, Trash2 } from 'lucide-react';

interface GoalCardProps {
  goal: Goal;
  handleDeleteGoal: (id: string) => Promise<void>;
  handleUpdateStatus: (id: string, newStatus: Goal['status']) => Promise<void>;
}

export function GoalCard({ goal, handleDeleteGoal, handleUpdateStatus }: GoalCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 flex flex-col justify-between"
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="font-bold text-lg">{goal.title}</h3>
            <div className="flex items-center gap-1.5 text-xs text-surface-500 mt-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>
                {new Date(goal.startDate).toLocaleDateString()} -{' '}
                {new Date(goal.endDate).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                goal.status === 'completed'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
                  : goal.status === 'failed'
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
              }`}
            >
              {goal.status}
            </span>
            <button
              onClick={() => void handleDeleteGoal(goal.id)}
              className="p-1 rounded text-surface-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/25 transition-colors"
              title="Delete Goal"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 py-4 my-4 bg-surface-50 dark:bg-surface-800/40 rounded-xl text-center">
          <div>
            <p className="text-[10px] text-surface-500 uppercase font-bold">Reduction</p>
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-0.5">
              <Percent className="w-4 h-4" />
              <span>{goal.targetReductionPct}</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-surface-500 uppercase font-bold">Baseline</p>
            <p className="text-lg font-bold text-surface-800 dark:text-white">
              {goal.baselineKg.toFixed(0)}{' '}
              <span className="text-xs font-normal text-surface-500">kg</span>
            </p>
          </div>
          <div>
            <p className="text-[10px] text-surface-500 uppercase font-bold">Goal Target</p>
            <p className="text-lg font-bold text-surface-800 dark:text-white">
              {(goal.baselineKg * (1 - goal.targetReductionPct / 100)).toFixed(0)}{' '}
              <span className="text-xs font-normal text-surface-500">kg</span>
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-4 border-t border-surface-100 dark:border-surface-800">
        <div className="flex justify-between text-xs font-semibold">
          <span className="text-surface-500">Goal Progress</span>
          <span className="text-emerald-500">{goal.progressPct}% Reduction Path</span>
        </div>
        <div className="w-full bg-surface-200 dark:bg-surface-800 h-2 rounded-full overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${goal.progressPct}%` }}
          />
        </div>
        {goal.status === 'active' ? (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => void handleUpdateStatus(goal.id, 'completed')}
              className="flex-1 py-1.5 text-xs font-semibold rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/40 transition-colors"
            >
              Mark Done
            </button>
            <button
              onClick={() => void handleUpdateStatus(goal.id, 'failed')}
              className="flex-1 py-1.5 text-xs font-semibold rounded bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
            >
              Mark Failed
            </button>
          </div>
        ) : (
          <div className="pt-2">
            <button
              onClick={() => void handleUpdateStatus(goal.id, 'active')}
              className="w-full py-1.5 text-xs font-semibold rounded bg-surface-100 dark:bg-surface-800 text-surface-600 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-700 transition-colors"
            >
              Re-activate
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
