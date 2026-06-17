import type { SimulationAction, SimulationActionType } from '@carbonwise/shared';
import { Plus, Trash2, Play } from 'lucide-react';

interface CustomSandboxProps {
  customName: string;
  setCustomName: (name: string) => void;
  customActions: SimulationAction[];
  addCustomAction: () => void;
  removeCustomAction: (idx: number) => void;
  updateCustomActionType: (idx: number, type: SimulationActionType) => void;
  updateCustomActionParams: (idx: number, params: Partial<SimulationAction['params']>) => void;
  setCustomActions: React.Dispatch<React.SetStateAction<SimulationAction[]>>;
  handleCustomSimulation: () => void;
  loading: boolean;
}

export function CustomSandbox({
  customName,
  setCustomName,
  customActions,
  addCustomAction,
  removeCustomAction,
  updateCustomActionType,
  updateCustomActionParams,
  setCustomActions,
  handleCustomSimulation,
  loading,
}: CustomSandboxProps) {
  return (
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
                        const currentAction = next[idx];
                        if (currentAction) {
                          currentAction.subcategory = e.target.value;
                          setCustomActions(next);
                        }
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
  );
}
