import type { SustainabilityTwin } from '@carbonwise/shared';
import { Users, AlertCircle, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';
import { PriorityActions } from './components/PriorityActions';
import { ProjectedSavings } from './components/ProjectedSavings';
import { TwinComparison } from './components/TwinComparison';

export function TwinPage() {
  const [twin, setTwin] = useState<SustainabilityTwin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchTwin() {
      setLoading(true);
      setError('');
      try {
        const result = await api.get<SustainabilityTwin>('/twin');
        setTwin(result);
      } catch (err: unknown) {
        setError((err as { message?: string }).message || 'Failed to load sustainability twin');
      } finally {
        setLoading(false);
      }
    }
    void fetchTwin();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
        <p className="text-surface-500 animate-pulse">Syncing virtual twin profile...</p>
      </div>
    );
  }

  if (error || !twin) {
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto mt-12">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-amber-500" />
        <h2 className="text-xl font-bold mb-2">Insufficient Activity History</h2>
        <p className="text-surface-600 dark:text-surface-400 mb-6">
          {error || 'We need at least 3 days of carbon logs to construct your virtual sustainability twin.'}
        </p>
        <a href="/carbon" className="btn-primary">
          Log Carbon Activity
        </a>
      </div>
    );
  }

  const { gapAnalysis, projectedSavings } = twin;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3">
            <Users className="w-8 h-8 text-emerald-500" />
            <span>Sustainability Twin</span>
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Compare your carbon profile against your ideal low-carbon virtual self.
          </p>
        </div>
        <div className="bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-4 py-2 rounded-xl border border-emerald-500/20 text-sm font-semibold flex items-center gap-2">
          <Shield className="w-4 h-4" />
          <span>Profile Synced Live</span>
        </div>
      </div>

      {/* Main Twin Comparison Card */}
      <TwinComparison twin={twin} />

      {/* Projected Savings Stat Grid */}
      <ProjectedSavings projectedSavings={projectedSavings} />

      {/* Gap Analysis & Action Steps */}
      <PriorityActions gapAnalysis={gapAnalysis} />
    </div>
  );
}
