import { SIMULATION_TEMPLATES } from '@carbonwise/shared';
import type {
  SimulationResponse,
  SimulationScenario,
  SimulationAction,
  SimulationActionType,
} from '@carbonwise/shared';
import { Zap, AlertCircle, RotateCcw, Sparkles, Info } from 'lucide-react';
import { useState } from 'react';

import { api } from '../../lib/api';
import { CustomSandbox } from './components/CustomSandbox';
import { PresetTemplates } from './components/PresetTemplates';
import { SimulationResults } from './components/SimulationResults';

export function SimulatorPage() {
  const [activeTab, setActiveTab] = useState<'presets' | 'custom'>('presets');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<SimulationResponse | null>(null);
  const [error, setError] = useState('');

  // Preset scenarios list for selection
  const [selectedPresets, setSelectedPresets] = useState<string[]>([]);

  // Custom scenario creation state
  const [customName, setCustomName] = useState('My Custom Action Plan');
  const [customActions, setCustomActions] = useState<SimulationAction[]>([
    {
      type: 'switch_transport',
      category: 'transportation',
      subcategory: 'car',
      description: 'Switch driving to public transport 3 days/week',
      params: { newMode: 'bus', daysPerWeek: 3 },
    },
  ]);

  // Handle Preset Simulation
  const handlePresetSimulation = async () => {
    if (selectedPresets.length === 0) {
      setError('Please select at least one preset to simulate.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const scenarios: SimulationScenario[] = selectedPresets
        .map((id) => {
          const template = SIMULATION_TEMPLATES.find((t) => t.id === id);
          if (!template) return null;
          return {
            id: template.id,
            name: template.title,
            actions: template.actions,
          };
        })
        .filter((s): s is SimulationScenario => s !== null);

      const res = await api.post<SimulationResponse>('/simulator', { scenarios });
      setResponse(res);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to simulate actions');
    } finally {
      setLoading(false);
    }
  };

  // Handle Custom Simulation
  const handleCustomSimulation = async () => {
    if (customActions.length === 0) {
      setError('Please add at least one action to simulate.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const scenario: SimulationScenario = {
        id: 'custom-scenario',
        name: customName,
        actions: customActions,
      };

      const res = await api.post<SimulationResponse>('/simulator', { scenarios: [scenario] });
      setResponse(res);
    } catch (err: unknown) {
      setError((err as { message?: string }).message || 'Failed to simulate custom action plan');
    } finally {
      setLoading(false);
    }
  };

  const togglePreset = (id: string) => {
    setSelectedPresets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const addCustomAction = () => {
    setCustomActions((prev) => [
      ...prev,
      {
        type: 'reduce_usage',
        category: 'home',
        subcategory: 'electricity',
        description: 'Reduce AC/heating power by 15%',
        params: { reductionPercent: 15 },
      },
    ]);
  };

  const removeCustomAction = (idx: number) => {
    setCustomActions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCustomActionType = (idx: number, type: SimulationActionType) => {
    setCustomActions((prev) => {
      const next = [...prev];
      const action = next[idx];
      if (!action) return prev;
      action.type = type;

      // Reset values based on types
      if (type === 'switch_transport') {
        action.category = 'transportation';
        action.subcategory = 'car';
        action.description = 'Switch to public transport';
        action.params = { newMode: 'bus', daysPerWeek: 3 };
      } else if (type === 'reduce_usage') {
        action.category = 'home';
        action.subcategory = 'electricity';
        action.description = 'Reduce energy usage';
        action.params = { reductionPercent: 20 };
      } else if (type === 'change_diet') {
        action.category = 'food';
        action.subcategory = 'non_vegetarian';
        action.description = 'Change diet to vegetarian';
        action.params = { newDietType: 'vegetarian' };
      } else {
        action.category = 'lifestyle';
        action.subcategory = 'shopping';
        action.description = 'Reduce carbon lifestyle';
        action.params = { reductionPercent: 10 };
      }

      return next;
    });
  };

  const updateCustomActionParams = (idx: number, params: Partial<SimulationAction['params']>) => {
    setCustomActions((prev) => {
      const next = [...prev];
      const action = next[idx];
      if (!action) return prev;
      action.params = { ...action.params, ...params };

      // Re-generate description based on changes
      if (action.type === 'switch_transport') {
        action.description = `Switch driving to ${action.params.newMode} for ${action.params.daysPerWeek} days/week`;
      } else if (action.type === 'reduce_usage') {
        action.description = `Reduce ${action.category}/${action.subcategory} by ${action.params.reductionPercent}%`;
      } else if (action.type === 'change_diet') {
        action.description = `Change diet to ${action.params.newDietType}`;
      } else {
        action.description = `Reduce ${action.category}/${action.subcategory} by ${action.params.reductionPercent}%`;
      }

      return next;
    });
  };

  const resetSimulation = () => {
    setResponse(null);
    setSelectedPresets([]);
    setError('');
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <Zap className="w-8 h-8 text-emerald-500" />
            <span>Smart Action Simulator</span>
          </h1>
          <p className="text-surface-500 dark:text-surface-400 mt-1">
            Test hypothetical "what if" actions to see instant carbon reduction.
          </p>
        </div>
        {response && (
          <button onClick={resetSimulation} className="btn-secondary py-2 px-4 text-sm flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/30 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-semibold">{error}</span>
        </div>
      )}

      {!response ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Tabs */}
            <div className="flex border-b border-surface-200 dark:border-surface-700">
              <button
                className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
                  activeTab === 'presets'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-surface-500 hover:text-surface-700'
                }`}
                onClick={() => setActiveTab('presets')}
              >
                Preset Templates
              </button>
              <button
                className={`py-3 px-6 font-bold text-sm border-b-2 transition-colors ${
                  activeTab === 'custom'
                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-surface-500 hover:text-surface-700'
                }`}
                onClick={() => setActiveTab('custom')}
              >
                Custom Sandbox
              </button>
            </div>

            {activeTab === 'presets' ? (
              <PresetTemplates
                selectedPresets={selectedPresets}
                togglePreset={togglePreset}
                handlePresetSimulation={() => { void handlePresetSimulation(); }}
                loading={loading}
              />
            ) : (
              <CustomSandbox
                customName={customName}
                setCustomName={setCustomName}
                customActions={customActions}
                addCustomAction={addCustomAction}
                removeCustomAction={removeCustomAction}
                updateCustomActionType={updateCustomActionType}
                updateCustomActionParams={updateCustomActionParams}
                setCustomActions={setCustomActions}
                handleCustomSimulation={() => { void handleCustomSimulation(); }}
                loading={loading}
              />
            )}
          </div>

          {/* Quick Context Card */}
          <div className="glass-card p-6 h-fit space-y-4">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <Sparkles className="w-5 h-5" />
              <span>AI Simulator Guidance</span>
            </div>
            <p className="text-xs text-surface-600 dark:text-surface-400 leading-relaxed">
              This engine pulls your average activity tracking footprint dynamically over the past month.
              Adjust commuting patterns, diet shifts, or home heating levels to immediately see your future savings.
            </p>
            <div className="p-3 rounded-xl bg-surface-100 dark:bg-surface-800 flex items-start gap-2.5 text-xs text-surface-500">
              <Info className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
              <span>
                All carbon estimates utilize national emissions guidelines calibrated for domestic usage.
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Results View */
        <SimulationResults response={response} />
      )}
    </div>
  );
}
