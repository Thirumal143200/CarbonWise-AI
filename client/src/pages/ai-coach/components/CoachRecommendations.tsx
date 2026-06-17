import { Sparkles, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import type { RecommendationResult } from '../types';

interface CoachRecommendationsProps {
  selectedRecType: 'weekly_plan' | 'reduction_advice' | 'behavioral_insight';
  setSelectedRecType: (type: 'weekly_plan' | 'reduction_advice' | 'behavioral_insight') => void;
  recLoading: boolean;
  recommendationResult: RecommendationResult | null;
  handleGenerateRecommendation: () => Promise<void>;
}

export function CoachRecommendations({
  selectedRecType,
  setSelectedRecType,
  recLoading,
  recommendationResult,
  handleGenerateRecommendation,
}: CoachRecommendationsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-1 glass-card p-6 space-y-6 h-fit">
        <h3 className="font-bold text-lg">Select Advice Focus</h3>
        <p className="text-xs text-surface-500">
          Generate target plans, behavioral insights, or step-by-step reduction targets.
        </p>

        <div className="space-y-2">
          {[
            { type: 'reduction_advice', label: 'Reduction Advice', desc: 'Get practical action tips.' },
            { type: 'weekly_plan', label: 'Weekly plan', desc: 'Step-by-step daily eco guide.' },
            { type: 'behavioral_insight', label: 'Behavioral Insights', desc: 'Identify patterns in your history.' },
          ].map((item) => (
            <button
              key={item.type}
              onClick={() => setSelectedRecType(item.type as 'weekly_plan' | 'reduction_advice' | 'behavioral_insight')}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedRecType === item.type
                  ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20'
                  : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:border-surface-300'
              }`}
            >
              <h4 className="font-bold text-sm">{item.label}</h4>
              <p className="text-[10px] text-surface-500 mt-1">{item.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => { void handleGenerateRecommendation(); }}
          disabled={recLoading}
          className="w-full btn-primary py-3 flex items-center justify-center gap-2"
        >
          {recLoading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate Advice</span>
            </>
          )}
        </button>
      </div>

      <div className="lg:col-span-2 glass-card p-6 md:p-8 min-h-[300px] flex flex-col justify-between">
        {recLoading ? (
          <div className="flex flex-col items-center justify-center h-64 space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500" />
            <p className="text-xs text-surface-500 animate-pulse">Engaging Gemini analysis model...</p>
          </div>
        ) : recommendationResult ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
            <div className="flex justify-between items-center border-b border-surface-200 dark:border-surface-800 pb-3">
              <h3 className="font-bold text-lg capitalize">{selectedRecType.replace('_', ' ')}</h3>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-bold px-2 py-1 rounded">
                Freshly Calibrated
              </span>
            </div>

            {/* Structured recommendation responses */}
            {selectedRecType === 'reduction_advice' && recommendationResult.recommendations && (
              <div className="space-y-4">
                {recommendationResult.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40 border border-surface-200/50 dark:border-surface-700/50">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-sm">{rec.title}</h4>
                      <span className="text-[10px] bg-emerald-600/15 text-emerald-500 font-bold px-2 py-0.5 rounded capitalize">
                        {rec.impact} Impact
                      </span>
                    </div>
                    <p className="text-xs text-surface-600 dark:text-surface-400">{rec.description}</p>
                  </div>
                ))}
              </div>
            )}

            {selectedRecType === 'weekly_plan' && recommendationResult.days && (
              <div className="space-y-4">
                <p className="text-xs text-surface-500">Weekly Target Reduction: {recommendationResult.weeklyTotal}</p>
                {recommendationResult.days.map((d, idx) => (
                  <div key={idx} className="flex gap-4 p-3 rounded-lg bg-surface-50 dark:bg-surface-800/40">
                    <span className="font-bold text-sm text-emerald-500 min-w-16">{d.day}</span>
                    <div>
                      <p className="font-semibold text-xs text-surface-800 dark:text-white">{d.action}</p>
                      <p className="text-[10px] text-surface-500 mt-0.5">Impact savings: {d.impact}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedRecType === 'behavioral_insight' && recommendationResult.insights && (
              <div className="space-y-4">
                {recommendationResult.insights.map((ins, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-surface-50 dark:bg-surface-800/40">
                    <h4 className="font-bold text-xs text-surface-800 dark:text-white mb-1">Pattern: {ins.pattern}</h4>
                    <p className="text-xs text-surface-600 dark:text-surface-400 mb-2">{ins.suggestion}</p>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-500 font-semibold px-2 py-0.5 rounded">
                      Savings: {ins.potentialSavingsKg} kg CO₂/wk
                    </span>
                  </div>
                ))}
              </div>
            )}

            {!recommendationResult.insights && !recommendationResult.days && !recommendationResult.recommendations && (
              <pre className="p-4 bg-surface-900 text-green-400 rounded-xl text-xs overflow-x-auto">
                {JSON.stringify(recommendationResult, null, 2)}
              </pre>
            )}
          </motion.div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <HelpCircle className="w-12 h-12 text-surface-300 mb-3" />
            <h4 className="font-bold text-sm text-surface-500">No Advice Generated Yet</h4>
            <p className="text-xs text-surface-400 max-w-xs mt-1">
              Select your advice focus on the left and click "Generate Advice" to receive custom steps.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
