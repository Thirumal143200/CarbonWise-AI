import { motion, AnimatePresence } from 'framer-motion';
import { Target, Sparkles } from 'lucide-react';
import type { FormEvent, RefObject } from 'react';

interface CreateGoalModalProps {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  title: string;
  setTitle: (title: string) => void;
  targetReductionPct: number;
  setTargetReductionPct: (pct: number) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  submitting: boolean;
  handleCreateGoal: (e: FormEvent) => Promise<void>;
  modalRef: RefObject<HTMLDivElement | null>;
}

export function CreateGoalModal({
  isModalOpen,
  setIsModalOpen,
  title,
  setTitle,
  targetReductionPct,
  setTargetReductionPct,
  endDate,
  setEndDate,
  submitting,
  handleCreateGoal,
  modalRef,
}: CreateGoalModalProps) {
  return (
    <AnimatePresence>
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
            className="glass-card p-6 w-full max-w-md bg-white dark:bg-surface-900 border border-surface-200 dark:border-surface-800 space-y-6"
          >
            <div className="flex justify-between items-center">
              <h2 id="modal-title" className="text-xl font-bold flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-500" />
                <span>Set New Target Goal</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-surface-400 hover:text-surface-600"
                aria-label="Close modal"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                void handleCreateGoal(e);
              }}
              className="space-y-4"
            >
              <div className="space-y-1">
                <label className="input-label" htmlFor="goal-title">
                  Goal Title
                </label>
                <input
                  type="text"
                  id="goal-title"
                  placeholder="e.g. Cut Commute Footprint"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="input-field"
                />
              </div>

              <div className="space-y-1">
                <label className="input-label" htmlFor="goal-reduction">
                  Target Reduction: {targetReductionPct}%
                </label>
                <input
                  type="range"
                  id="goal-reduction"
                  min="5"
                  max="50"
                  step="5"
                  value={targetReductionPct}
                  onChange={(e) => setTargetReductionPct(Number(e.target.value))}
                  className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="input-label" htmlFor="goal-end-date">
                  End Target Date
                </label>
                <input
                  type="date"
                  id="goal-end-date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  className="input-field"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary py-3 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Activate Reduction Goal</span>
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
