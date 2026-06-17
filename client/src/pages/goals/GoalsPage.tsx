import type { Goal } from '@carbonwise/shared';
import { Target, Plus, AlertCircle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { api } from '../../lib/api';
import { CreateGoalModal } from './components/CreateGoalModal';
import { GoalCard } from './components/GoalCard';

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
            lastEl?.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastEl) {
            firstEl?.focus();
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

  const handleDeleteGoal = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      setError('');
      await api.delete(`/goals/${id}`);
      setGoals((prev) => prev.filter((g) => g.id !== id));
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to delete goal');
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: Goal['status']) => {
    try {
      setError('');
      const data = await api.put<{ goal: Goal }>(`/goals/${id}`, { status: newStatus });
      setGoals((prev) => prev.map((g) => (g.id === id ? data.goal : g)));
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to update goal status');
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
            <GoalCard
              key={goal.id}
              goal={goal}
              handleDeleteGoal={handleDeleteGoal}
              handleUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}

      <CreateGoalModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        title={title}
        setTitle={setTitle}
        targetReductionPct={targetReductionPct}
        setTargetReductionPct={setTargetReductionPct}
        endDate={endDate}
        setEndDate={setEndDate}
        submitting={submitting}
        handleCreateGoal={handleCreateGoal}
        modalRef={modalRef}
      />
    </div>
  );
}
