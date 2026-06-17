import { SIMULATION_TEMPLATES } from '@carbonwise/shared';
import { Play } from 'lucide-react';

interface PresetTemplatesProps {
  selectedPresets: string[];
  togglePreset: (id: string) => void;
  handlePresetSimulation: () => void;
  loading: boolean;
}

export function PresetTemplates({
  selectedPresets,
  togglePreset,
  handlePresetSimulation,
  loading,
}: PresetTemplatesProps) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-surface-500">
        Select one or more templates to run a combined scenario simulation.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {SIMULATION_TEMPLATES.map((tpl) => {
          const isSelected = selectedPresets.includes(tpl.id);
          return (
            <button
              key={tpl.id}
              onClick={() => togglePreset(tpl.id)}
              className={`text-left p-5 rounded-2xl border transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/20'
                  : 'border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 hover:border-surface-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl" role="presentation">{tpl.icon}</span>
                <h3 className="font-bold text-sm">{tpl.title}</h3>
              </div>
              <p className="text-xs text-surface-500 leading-relaxed">
                {tpl.description}
              </p>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => { void handlePresetSimulation(); }}
        disabled={loading || selectedPresets.length === 0}
        className="w-full btn-primary mt-4 flex items-center justify-center gap-2"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
        ) : (
          <>
            <Play className="w-4 h-4" />
            <span>Run Simulation ({selectedPresets.length} selected)</span>
          </>
        )}
      </button>
    </div>
  );
}
