import { SIMULATION_TEMPLATES } from '@carbonwise/shared';
import type {
  SimulationResponse,
  SimulationScenario,
  SimulationAction,
  SimulationActionType,
} from '@carbonwise/shared';
import { motion } from 'framer-motion';
import {
  Zap,
  TreePine,
  Car,
  AlertCircle,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';
import { useState } from 'react';

import { api } from '../../lib/api';


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
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="input-label" htmlFor="scenario-name">Plan Name</label>
                  <input
                    type="text"
                    id="scenario-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm">Action List</h3>
                    <button
                      onClick={addCustomAction}
                      className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Action</span>
                    </button>
                  </div>

                  {customActions.map((action, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl border border-surface-200 dark:border-surface-800 bg-white dark:bg-surface-900 space-y-4 relative"
                    >
                      <button
                        onClick={() => removeCustomAction(idx)}
                        className="absolute top-4 right-4 text-surface-400 hover:text-red-500 transition-colors"
                        aria-label="Remove action"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Type */}
                        <div>
                          <label className="input-label" htmlFor={`action-type-${idx}`}>Action Type</label>
                          <select
                            id={`action-type-${idx}`}
                            value={action.type}
                            onChange={(e) =>
                              updateCustomActionType(idx, e.target.value as SimulationActionType)
                            }
                            className="input-field py-2.5 text-sm"
                          >
                            <option value="switch_transport">Switch Transport Mode</option>
                            <option value="reduce_usage">Reduce Power/Resource Usage</option>
                            <option value="change_diet">Change Diet Plan</option>
                            <option value="reduce_consumption">Reduce Consumables</option>
                          </select>
                        </div>

                        {/* Params depending on Type */}
                        {action.type === 'switch_transport' && (
                          <>
                            <div>
                              <label className="input-label" htmlFor={`new-mode-${idx}`}>New Commute Mode</label>
                              <select
                                id={`new-mode-${idx}`}
                                value={action.params.newMode || 'bus'}
                                onChange={(e) =>
                                  updateCustomActionParams(idx, { newMode: e.target.value })
                                }
                                className="input-field py-2.5 text-sm"
                              >
                                <option value="bus">Bus</option>
                                <option value="train">Train</option>
                                <option value="electric_car">Electric Car</option>
                                <option value="bike">Bicycle</option>
                                <option value="walking">Walking</option>
                              </select>
                            </div>
                            <div>
                              <label className="input-label" htmlFor={`days-per-week-${idx}`}>
                                Commute Days/Week: {action.params.daysPerWeek}
                              </label>
                              <input
                                type="range"
                                id={`days-per-week-${idx}`}
                                min="1"
                                max="7"
                                value={action.params.daysPerWeek || 3}
                                onChange={(e) =>
                                  updateCustomActionParams(idx, {
                                    daysPerWeek: parseInt(e.target.value, 10),
                                  })
                                }
                                className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                            </div>
                          </>
                        )}

                        {action.type === 'reduce_usage' && (
                          <>
                            <div>
                              <label className="input-label" htmlFor={`subcategory-${idx}`}>Subcategory</label>
                              <select
                                id={`subcategory-${idx}`}
                                value={action.subcategory}
                                onChange={(e) => {
                                  const next = [...customActions];
                                  next[idx].subcategory = e.target.value;
                                  setCustomActions(next);
                                }}
                                className="input-field py-2.5 text-sm"
                              >
                                <option value="electricity">Electricity</option>
                                <option value="water">Water</option>
                                <option value="lpg_gas">Gas</option>
                              </select>
                            </div>
                            <div>
                              <label className="input-label" htmlFor={`reduction-percent-${idx}`}>
                                Reduction Percent: {action.params.reductionPercent}%
                              </label>
                              <input
                                type="range"
                                id={`reduction-percent-${idx}`}
                                min="5"
                                max="100"
                                step="5"
                                value={action.params.reductionPercent || 20}
                                onChange={(e) =>
                                  updateCustomActionParams(idx, {
                                    reductionPercent: parseInt(e.target.value, 10),
                                  })
                                }
                                className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                              />
                            </div>
                          </>
                        )}

                        {action.type === 'change_diet' && (
                          <div>
                            <label className="input-label" htmlFor={`new-diet-${idx}`}>New Diet Target</label>
                            <select
                              id={`new-diet-${idx}`}
                              value={action.params.newDietType || 'vegetarian'}
                              onChange={(e) =>
                                updateCustomActionParams(idx, { newDietType: e.target.value })
                              }
                              className="input-field py-2.5 text-sm"
                            >
                              <option value="vegetarian">Vegetarian</option>
                              <option value="vegan">Vegan</option>
                              <option value="pescatarian">Pescatarian</option>
                              <option value="poultry">Poultry Only</option>
                            </select>
                          </div>
                        )}

                        {action.type === 'reduce_consumption' && (
                          <div>
                            <label className="input-label" htmlFor={`consumption-reduction-${idx}`}>
                              Reduction Percent: {action.params.reductionPercent}%
                            </label>
                            <input
                              type="range"
                              id={`consumption-reduction-${idx}`}
                              min="5"
                              max="100"
                              step="5"
                              value={action.params.reductionPercent || 10}
                              onChange={(e) =>
                                updateCustomActionParams(idx, {
                                  reductionPercent: parseInt(e.target.value, 10),
                                })
                              }
                              className="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => { void handleCustomSimulation(); }}
                  disabled={loading || customActions.length === 0}
                  className="w-full btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Simulate Custom Plan</span>
                    </>
                  )}
                </button>
              </div>
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
      )}
    </div>
  );
}
