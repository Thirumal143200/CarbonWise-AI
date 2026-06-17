import type { SustainabilityTwin } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import { Users, Zap } from 'lucide-react';

interface TwinComparisonProps {
  twin: SustainabilityTwin;
}

export function TwinComparison({ twin }: TwinComparisonProps) {
  const { currentProfile, idealProfile, gapAnalysis } = twin;

  return (
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
  );
}
