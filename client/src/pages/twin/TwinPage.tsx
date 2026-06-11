import type { SustainabilityTwin } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import {
  Users,
  TrendingDown,
  TreePine,
  Plane,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { api } from '../../lib/api';


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

  const { currentProfile, idealProfile, gapAnalysis, projectedSavings } = twin;

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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Current Self */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="gradient-card p-6 md:p-8 flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-6">
              <span className="bg-surface-200 dark:bg-surface-800 text-surface-800 dark:text-surface-200 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Current Profile
              </span>
              <p className="text-sm text-surface-500">Weekly Average</p>
            </div>
            <h2 className="text-4xl font-extrabold text-surface-900 dark:text-white mb-2">
              {currentProfile.overallScoreKgPerWeek.toFixed(1)}{' '}
              <span className="text-lg font-medium text-surface-500">kg CO₂e</span>
            </h2>
            <p className="text-sm text-surface-600 dark:text-surface-400 mb-6">
              Calculated based on your tracked lifestyle activities over the past 4 weeks.
            </p>

            <div className="space-y-4">
              {gapAnalysis.categories.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-surface-700 dark:text-surface-300">{c.category}</span>
                    <span className="text-surface-900 dark:text-white">{c.currentKg.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-surface-200 dark:bg-surface-700 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (c.currentKg / (currentProfile.overallScoreKgPerWeek || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-surface-200 dark:border-surface-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
              <Users className="w-5 h-5 text-surface-500" />
            </div>
            <div>
              <p className="text-xs text-surface-500">Behavioral Fingerprint</p>
              <p className="text-sm font-semibold">Commuter • Mixed Diet</p>
            </div>
          </div>
        </motion.div>

        {/* Ideal Twin */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 md:p-8 rounded-2xl shadow-glow flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-6">
              <span className="bg-white/20 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Ideal Carbon Twin
              </span>
              <p className="text-sm text-emerald-100">Target Level</p>
            </div>
            <h2 className="text-4xl font-extrabold mb-2">
              {idealProfile.overallScoreKgPerWeek.toFixed(1)}{' '}
              <span className="text-lg font-medium text-emerald-200">kg CO₂e</span>
            </h2>
            <p className="text-sm text-emerald-100 mb-6">
              Optimal low-carbon profile based on realistic local sustainable practices.
            </p>

            <div className="space-y-4">
              {gapAnalysis.categories.map((c) => (
                <div key={c.category} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-emerald-100">{c.category}</span>
                    <span>{c.idealKg.toFixed(1)} kg</span>
                  </div>
                  <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100,
                          (c.idealKg / (idealProfile.overallScoreKgPerWeek || 1)) * 100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs text-emerald-200">Ideal Profile Archetype</p>
                <p className="text-sm font-semibold">Active Commuter • Eco Vegetarian</p>
              </div>
            </div>
            <span className="text-xs bg-emerald-500 text-white px-2 py-1 rounded font-bold">
              -{gapAnalysis.totalGapPercent}% CO₂
            </span>
          </div>
        </motion.div>
      </div>

      {/* Projected Savings Stat Grid */}
      <div className="space-y-4">
        <h3 className="text-xl font-bold">Projected Impact Savings</h3>
        <p className="text-sm text-surface-500">
          Hypothetical annual savings if you align your lifestyle completely with your Carbon Twin.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                <TrendingDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <span className="text-xs font-semibold text-surface-500">Annual Carbon</span>
            </div>
            <h4 className="text-2xl font-bold">{projectedSavings.annualKgSaved.toLocaleString()} kg</h4>
            <p className="text-xs text-surface-500">Carbon offset savings</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-green-500/10 dark:bg-green-500/20 flex items-center justify-center">
                <TreePine className="w-4 h-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-xs font-semibold text-surface-500">Tree Absorption</span>
            </div>
            <h4 className="text-2xl font-bold">{projectedSavings.equivalentTreesPlanted}</h4>
            <p className="text-xs text-surface-500">Mature trees planted/year</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 dark:bg-sky-500/20 flex items-center justify-center">
                <Plane className="w-4 h-4 text-sky-600 dark:text-sky-400" />
              </div>
              <span className="text-xs font-semibold text-surface-500">Flight Avoidance</span>
            </div>
            <h4 className="text-2xl font-bold">{projectedSavings.equivalentFlightsAvoided}</h4>
            <p className="text-xs text-surface-500">Domestic flights avoided</p>
          </div>

          <div className="stat-card">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <DollarSign className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
              <span className="text-xs font-semibold text-surface-500">Financial Savings</span>
            </div>
            <h4 className="text-2xl font-bold">${projectedSavings.costSavingsUsd.toFixed(0)}</h4>
            <p className="text-xs text-surface-500">Average energy/utility cost cut</p>
          </div>
        </div>
      </div>

      {/* Gap Analysis & Action Steps */}
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
    </div>
  );
}
