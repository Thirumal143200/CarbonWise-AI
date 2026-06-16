import type { Goal } from '@carbonwise/shared';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, Plus, Calendar, Percent, AlertCircle, Sparkles } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { api } from '../../lib/api';

export function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [targetReductionPct, setTargetReductionPct] = useState(15);
  const [endDate, setEndDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const openButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    async function fetchGoals() {
      setLoading(true);
      setError('');
      try {
        const data = await api.get<{ goals: Goal[] }>('/goals');
        setGoals(data.goals);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Failed to fetch carbon reduction goals');
      } finally {
        setLoading(false);
      }
    }
    void fetchGoals();
  }, []);

  // Focus trapping and keyboard accessibility in the modal
  useEffect(() => {
    if (!isModalOpen) {
      openButtonRef.current?.focus();
      return;
    }

    const timer = setTimeout(() => {
      const firstInput = modalRef.current?.querySelector('input, select, button, textarea');
      if (firstInput instanceof HTMLElement) {
        firstInput.focus();
      }
    }, 100);

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
        return;
      }

      if (e.key === 'Tab' && modalRef.current) {
        const focusables = modalRef.current.querySelectorAll(
          'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, *[tabindex], *[contenteditable]',
        );
        const elements = Array.from(focusables) as HTMLElement[];
        if (elements.length === 0) return;

        const firstEl = elements[0];
        const lastEl = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl) {
            lastEl.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeydown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [isModalOpen]);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const startDateStr = new Date().toISOString().split('T')[0];
      const data = await api.post<{ goal: Goal }>('/goals', {
        title,
        targetReductionPct: Number(targetReductionPct),
        startDate: startDateStr,
        endDate,
      });
      setGoals((prev) => [data.goal, ...prev]);
      setIsModalOpen(false);
      setTitle('');
      setEndDate('');
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Target className="w-8 h-8 text-emerald-500" />
            <span>My Reductions Goals</span>
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Set and track carbon footprint reduction targets.
          </p>
        </div>
        <button
          ref={openButtonRef}
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2 py-2.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          <span>New Target</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-96" role="status">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
          <span className="sr-only">Loading goals...</span>
        </div>
      ) : goals.length === 0 ? (
        <div className="glass-card p-12 text-center max-w-lg mx-auto">
          <Target className="w-16 h-16 mx-auto mb-4 text-emerald-500/20" />
          <h3 className="text-xl font-bold mb-2">No Active Goals</h3>
          <p className="text-surface-600 dark:text-surface-400 mb-6">
            Setting targets keeps you accountable. Challenge yourself with a 10% reduction.
          </p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary">
            Create Your First Goal
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {goals.map((goal) => (
            <motion.div
              key={goal.id}
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
                  <span className="text-emerald-500">75% Reduction Path</span>
                </div>
                <div className="w-full bg-surface-200 dark:bg-surface-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: '75%' }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Goal creation modal */}
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
    </div>
  );
}
