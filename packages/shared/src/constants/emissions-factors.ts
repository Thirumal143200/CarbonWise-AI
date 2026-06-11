// ============================================
// Emission Factors — kg CO₂e per unit
// Sources: EPA, DEFRA, IPCC 2023 guidelines
// ============================================

export interface EmissionFactor {
  subcategory: string;
  factor: number;
  unit: string;
  description: string;
  source: string;
}

/**
 * Transportation emission factors (kg CO₂e per km)
 */
export const TRANSPORT_FACTORS: Record<string, EmissionFactor> = {
  car: {
    subcategory: 'car',
    factor: 0.21,
    unit: 'km',
    description: 'Average passenger car (petrol)',
    source: 'DEFRA 2023',
  },
  bike: {
    subcategory: 'bike',
    factor: 0.0,
    unit: 'km',
    description: 'Bicycle (zero direct emissions)',
    source: 'IPCC',
  },
  bus: {
    subcategory: 'bus',
    factor: 0.089,
    unit: 'km',
    description: 'Average local bus per passenger',
    source: 'DEFRA 2023',
  },
  metro: {
    subcategory: 'metro',
    factor: 0.033,
    unit: 'km',
    description: 'Metro/subway per passenger',
    source: 'DEFRA 2023',
  },
  train: {
    subcategory: 'train',
    factor: 0.041,
    unit: 'km',
    description: 'National rail per passenger',
    source: 'DEFRA 2023',
  },
  flight: {
    subcategory: 'flight',
    factor: 0.255,
    unit: 'km',
    description: 'Average flight per passenger (economy)',
    source: 'DEFRA 2023',
  },
};

/**
 * Home energy emission factors
 */
export const HOME_FACTORS: Record<string, EmissionFactor> = {
  electricity: {
    subcategory: 'electricity',
    factor: 0.433,
    unit: 'kWh',
    description: 'Grid electricity (global average)',
    source: 'IEA 2023',
  },
  lpg_gas: {
    subcategory: 'lpg_gas',
    factor: 1.51,
    unit: 'kg',
    description: 'LPG combustion per kg',
    source: 'DEFRA 2023',
  },
  water: {
    subcategory: 'water',
    factor: 0.000344,
    unit: 'liters',
    description: 'Water supply and treatment per liter',
    source: 'DEFRA 2023',
  },
};

/**
 * Lifestyle emission factors
 */
export const LIFESTYLE_FACTORS: Record<string, EmissionFactor> = {
  shopping: {
    subcategory: 'shopping',
    factor: 10.0,
    unit: 'items',
    description: 'Average clothing item production',
    source: 'EPA 2023',
  },
  plastic: {
    subcategory: 'plastic',
    factor: 6.0,
    unit: 'kg',
    description: 'Plastic production and disposal per kg',
    source: 'EPA 2023',
  },
  electronics: {
    subcategory: 'electronics',
    factor: 300.0,
    unit: 'items',
    description: 'Average electronic device (smartphone-sized)',
    source: 'EPA 2023',
  },
};

/**
 * Food emission factors (kg CO₂e per meal)
 */
export const FOOD_FACTORS: Record<string, EmissionFactor> = {
  vegetarian: {
    subcategory: 'vegetarian',
    factor: 1.7,
    unit: 'meals',
    description: 'Average vegetarian meal',
    source: 'Our World in Data',
  },
  vegan: {
    subcategory: 'vegan',
    factor: 1.0,
    unit: 'meals',
    description: 'Average vegan meal',
    source: 'Our World in Data',
  },
  non_vegetarian: {
    subcategory: 'non_vegetarian',
    factor: 3.3,
    unit: 'meals',
    description: 'Average non-vegetarian meal (with beef)',
    source: 'Our World in Data',
  },
};

/**
 * Get emission factor by category and subcategory
 */
export function getEmissionFactor(
  category: string,
  subcategory: string,
): EmissionFactor | undefined {
  const factorMaps: Record<string, Record<string, EmissionFactor>> = {
    transportation: TRANSPORT_FACTORS,
    home: HOME_FACTORS,
    lifestyle: LIFESTYLE_FACTORS,
    food: FOOD_FACTORS,
  };

  return factorMaps[category]?.[subcategory];
}

/**
 * Calculate emissions in kg CO₂e
 */
export function calculateEmissions(
  category: string,
  subcategory: string,
  amount: number,
): number {
  const factor = getEmissionFactor(category, subcategory);
  if (!factor) {
    throw new Error(`Unknown emission factor: ${category}/${subcategory}`);
  }
  return Math.round(amount * factor.factor * 1000) / 1000;
}

/**
 * Conversion helpers for relatable equivalents
 */
export const EQUIVALENTS = {
  /** kg CO₂ absorbed by one tree per year */
  KG_PER_TREE_PER_YEAR: 21.77,
  /** kg CO₂ per average domestic flight (1000 km) */
  KG_PER_DOMESTIC_FLIGHT: 255,
  /** kg CO₂ per car mile (average US car) */
  KG_PER_CAR_MILE: 0.404,
  /** USD saved per kg CO₂ reduced (energy cost proxy) */
  USD_PER_KG_SAVED: 0.05,
} as const;
