// ============================================
// Category Constants
// ============================================

export const CARBON_CATEGORIES = ['transportation', 'home', 'lifestyle', 'food'] as const;

export const SUBCATEGORIES = {
  transportation: ['car', 'bike', 'bus', 'metro', 'train', 'flight'] as const,
  home: ['electricity', 'lpg_gas', 'water'] as const,
  lifestyle: ['shopping', 'plastic', 'electronics'] as const,
  food: ['vegetarian', 'vegan', 'non_vegetarian'] as const,
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  transportation: 'Transportation',
  home: 'Home & Energy',
  lifestyle: 'Lifestyle',
  food: 'Food & Diet',
};

export const SUBCATEGORY_LABELS: Record<string, string> = {
  car: 'Car',
  bike: 'Bicycle',
  bus: 'Bus',
  metro: 'Metro / Subway',
  train: 'Train',
  flight: 'Flight',
  electricity: 'Electricity',
  lpg_gas: 'LPG / Gas',
  water: 'Water Usage',
  shopping: 'Shopping',
  plastic: 'Plastic Usage',
  electronics: 'Electronics',
  vegetarian: 'Vegetarian Meal',
  vegan: 'Vegan Meal',
  non_vegetarian: 'Non-Vegetarian Meal',
};

export const CATEGORY_ICONS: Record<string, string> = {
  transportation: '🚗',
  home: '🏠',
  lifestyle: '🛍️',
  food: '🍽️',
};

export const SUBCATEGORY_ICONS: Record<string, string> = {
  car: '🚗',
  bike: '🚲',
  bus: '🚌',
  metro: '🚇',
  train: '🚆',
  flight: '✈️',
  electricity: '⚡',
  lpg_gas: '🔥',
  water: '💧',
  shopping: '🛒',
  plastic: '🧴',
  electronics: '📱',
  vegetarian: '🥗',
  vegan: '🌱',
  non_vegetarian: '🥩',
};

/** National average carbon footprint (kg CO₂e per year) */
export const NATIONAL_AVERAGES: Record<string, number> = {
  global: 4700,
  india: 1900,
  us: 15520,
  uk: 5500,
  eu: 6800,
  china: 7380,
};

/** Units per subcategory */
export const SUBCATEGORY_UNITS: Record<string, string> = {
  car: 'km',
  bike: 'km',
  bus: 'km',
  metro: 'km',
  train: 'km',
  flight: 'km',
  electricity: 'kWh',
  lpg_gas: 'kg',
  water: 'liters',
  shopping: 'items',
  plastic: 'kg',
  electronics: 'items',
  vegetarian: 'meals',
  vegan: 'meals',
  non_vegetarian: 'meals',
};
