import type { SustainabilityTwin } from '@carbonwise/shared';
import { TrendingDown, TreePine, Plane, DollarSign } from 'lucide-react';

interface ProjectedSavingsProps {
  projectedSavings: SustainabilityTwin['projectedSavings'];
}

export function ProjectedSavings({ projectedSavings }: ProjectedSavingsProps) {
  return (
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
  );
}
