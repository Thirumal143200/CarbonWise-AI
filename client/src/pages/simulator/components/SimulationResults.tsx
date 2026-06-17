import type { SimulationResponse } from '@carbonwise/shared';
import { motion } from 'framer-motion';
import { TreePine, Car } from 'lucide-react';

interface SimulationResultsProps {
  response: SimulationResponse;
}

export function SimulationResults({ response }: SimulationResultsProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Combined Impact Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <span className="text-xs font-semibold text-surface-500">Projected Carbon Saved</span>
          <h3 className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {response.combinedImpact.totalReductionKg.toLocaleString()} kg
          </h3>
          <p className="text-xs text-surface-500 mt-1">
            A decrease of {response.combinedImpact.totalReductionPercent}% weekly
          </p>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-surface-500">Tree Absorption Equivalent</span>
          <h3 className="text-3xl font-extrabold text-green-600 dark:text-green-400 mt-1 flex items-center gap-2">
            <TreePine className="w-7 h-7" />
            <span>{response.combinedImpact.equivalentTreesPlanted} trees</span>
          </h3>
          <p className="text-xs text-surface-500 mt-1">Absorbed over a year</p>
        </div>

        <div className="stat-card">
          <span className="text-xs font-semibold text-surface-500">Annualized Car Commutes</span>
          <h3 className="text-3xl font-extrabold text-sky-600 dark:text-sky-400 mt-1 flex items-center gap-2">
            <Car className="w-7 h-7" />
            <span>{response.combinedImpact.equivalentCarMilesAvoided.toLocaleString()} mi</span>
          </h3>
          <p className="text-xs text-surface-500 mt-1">Driving avoidance equivalent</p>
        </div>
      </div>

      {/* Detailed Scenario Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-bold">Simulated Scenarios</h2>

          <div className="space-y-6">
            {response.scenarios.map((scenario) => (
              <div key={scenario.scenarioId} className="space-y-4 p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-surface-50 dark:bg-surface-800/20">
                <div className="flex justify-between items-center border-b border-surface-200 dark:border-surface-800 pb-3">
                  <div>
                    <h4 className="font-bold text-base">{scenario.scenarioName}</h4>
                    <p className="text-xs text-surface-500">
                      Reduction: {scenario.reductionKg} kg (-{scenario.reductionPercent}%)
                    </p>
                  </div>
                  <span className="text-xs bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-semibold px-2 py-1 rounded">
                    Feasibility: {scenario.feasibility.overall.toFixed(1)}/10
                  </span>
                </div>

                <div className="space-y-3">
                  {scenario.breakdown.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-xs">
                      <div>
                        <p className="font-semibold text-surface-800 dark:text-surface-200">{item.action}</p>
                        <p className="text-surface-500">Before: {item.beforeKg.toFixed(1)} kg • After: {item.afterKg.toFixed(1)} kg</p>
                      </div>
                      <span className="text-emerald-500 font-bold">-{item.savedKg.toFixed(1)} kg/wk</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feasibility Factors */}
        <div className="glass-card p-6 md:p-8 space-y-6">
          <h3 className="text-xl font-bold">Feasibility & Adoption Analysis</h3>

          {response.scenarios.map((scenario) => (
            <div key={scenario.scenarioId} className="space-y-4">
              <h4 className="font-bold text-sm border-b border-surface-200 dark:border-surface-800 pb-2">
                {scenario.scenarioName}
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-surface-50 dark:bg-surface-800/30 rounded-lg">
                  <p className="text-surface-500 mb-0.5">Effort Level</p>
                  <p className="font-bold capitalize">{scenario.feasibility.factors.effortLevel}</p>
                </div>
                <div className="p-3 bg-surface-50 dark:bg-surface-800/30 rounded-lg">
                  <p className="text-surface-500 mb-0.5">Financial Impact</p>
                  <p className="font-bold capitalize text-emerald-500">{scenario.feasibility.factors.costImpact}</p>
                </div>
                <div className="p-3 bg-surface-50 dark:bg-surface-800/30 rounded-lg">
                  <p className="text-surface-500 mb-0.5">Adoption Time</p>
                  <p className="font-bold">{scenario.feasibility.factors.timeToAdopt}</p>
                </div>
                <div className="p-3 bg-surface-50 dark:bg-surface-800/30 rounded-lg">
                  <p className="text-surface-500 mb-0.5">Sustainability Index</p>
                  <p className="font-bold">{scenario.feasibility.factors.sustainabilityIndex}/10</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
