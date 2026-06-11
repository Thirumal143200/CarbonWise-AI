// ============================================
// Smart Action Simulator Types
// ============================================

export interface SimulationRequest {
  scenarios: SimulationScenario[];
}

export interface SimulationScenario {
  id: string;
  name: string;
  actions: SimulationAction[];
}

export interface SimulationAction {
  type: SimulationActionType;
  category: string;
  subcategory: string;
  /** Change description, e.g., "reduce by 20%" or "switch to public transport 3 days/week" */
  description: string;
  /** Quantified change params */
  params: SimulationParams;
}

export type SimulationActionType =
  | 'switch_transport'
  | 'reduce_usage'
  | 'change_diet'
  | 'reduce_consumption'
  | 'switch_energy_source';

export interface SimulationParams {
  /** For switch_transport: new mode */
  newMode?: string;
  /** For reduce_usage: percentage reduction (0-100) */
  reductionPercent?: number;
  /** For switch_transport: days per week */
  daysPerWeek?: number;
  /** For change_diet: new diet type */
  newDietType?: string;
  /** For reduce_consumption: new amount */
  newAmount?: number;
  /** Unit for the new amount */
  unit?: string;
}

export interface SimulationResponse {
  scenarios: SimulationResult[];
  combinedImpact: CombinedImpact;
  generatedAt: string;
}

export interface SimulationResult {
  scenarioId: string;
  scenarioName: string;
  currentEmissionsKg: number;
  projectedEmissionsKg: number;
  reductionKg: number;
  reductionPercent: number;
  breakdown: SimulationBreakdown[];
  feasibility: FeasibilityScore;
}

export interface SimulationBreakdown {
  action: string;
  beforeKg: number;
  afterKg: number;
  savedKg: number;
}

export interface FeasibilityScore {
  overall: number; // 0-10
  factors: {
    costImpact: 'savings' | 'neutral' | 'expense';
    effortLevel: 'low' | 'medium' | 'high';
    timeToAdopt: string; // e.g., "1 week", "1 month"
    sustainabilityIndex: number; // how likely to sustain long-term 0-10
  };
}

export interface CombinedImpact {
  totalReductionKg: number;
  totalReductionPercent: number;
  annualizedSavingsKg: number;
  equivalentTreesPlanted: number;
  equivalentCarMilesAvoided: number;
}

/** Preset simulation templates for quick "what if" scenarios */
export interface SimulationTemplate {
  id: string;
  title: string;
  description: string;
  icon: string;
  actions: SimulationAction[];
}

export const SIMULATION_TEMPLATES: SimulationTemplate[] = [
  {
    id: 'public-transport',
    title: 'Switch to Public Transport',
    description: 'What if I use public transport 3 days a week instead of driving?',
    icon: '🚌',
    actions: [
      {
        type: 'switch_transport',
        category: 'transportation',
        subcategory: 'car',
        description: 'Use public transport 3 days/week',
        params: { newMode: 'bus', daysPerWeek: 3 },
      },
    ],
  },
  {
    id: 'reduce-ac',
    title: 'Reduce AC Usage',
    description: 'What if I reduce AC usage by 20%?',
    icon: '❄️',
    actions: [
      {
        type: 'reduce_usage',
        category: 'home',
        subcategory: 'electricity',
        description: 'Reduce AC by 20%',
        params: { reductionPercent: 20 },
      },
    ],
  },
  {
    id: 'go-vegetarian',
    title: 'Go Vegetarian',
    description: 'What if I switch to a vegetarian diet?',
    icon: '🥬',
    actions: [
      {
        type: 'change_diet',
        category: 'food',
        subcategory: 'non_vegetarian',
        description: 'Switch to vegetarian diet',
        params: { newDietType: 'vegetarian' },
      },
    ],
  },
  {
    id: 'go-vegan',
    title: 'Go Vegan',
    description: 'What if I switch to a fully vegan diet?',
    icon: '🌱',
    actions: [
      {
        type: 'change_diet',
        category: 'food',
        subcategory: 'non_vegetarian',
        description: 'Switch to vegan diet',
        params: { newDietType: 'vegan' },
      },
    ],
  },
  {
    id: 'reduce-plastic',
    title: 'Eliminate Single-Use Plastic',
    description: 'What if I stop using single-use plastics?',
    icon: '♻️',
    actions: [
      {
        type: 'reduce_consumption',
        category: 'lifestyle',
        subcategory: 'plastic',
        description: 'Eliminate single-use plastic',
        params: { reductionPercent: 90 },
      },
    ],
  },
  {
    id: 'cycle-commute',
    title: 'Cycle to Work',
    description: 'What if I cycle to work every day?',
    icon: '🚲',
    actions: [
      {
        type: 'switch_transport',
        category: 'transportation',
        subcategory: 'car',
        description: 'Cycle to work daily',
        params: { newMode: 'bike', daysPerWeek: 5 },
      },
    ],
  },
  {
    id: 'energy-saver',
    title: 'Full Energy Saver Mode',
    description: 'What if I reduce electricity by 30% and gas by 25%?',
    icon: '⚡',
    actions: [
      {
        type: 'reduce_usage',
        category: 'home',
        subcategory: 'electricity',
        description: 'Reduce electricity 30%',
        params: { reductionPercent: 30 },
      },
      {
        type: 'reduce_usage',
        category: 'home',
        subcategory: 'lpg_gas',
        description: 'Reduce gas 25%',
        params: { reductionPercent: 25 },
      },
    ],
  },
];
