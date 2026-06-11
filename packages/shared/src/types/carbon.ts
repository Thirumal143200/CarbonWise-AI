// ============================================
// Carbon Entry Types
// ============================================

export type CarbonCategory = 'transportation' | 'home' | 'lifestyle' | 'food';

export type TransportSubcategory = 'car' | 'bike' | 'bus' | 'metro' | 'train' | 'flight';

export type HomeSubcategory = 'electricity' | 'lpg_gas' | 'water';

export type LifestyleSubcategory = 'shopping' | 'plastic' | 'electronics';

export type FoodSubcategory = 'vegetarian' | 'vegan' | 'non_vegetarian';

export type CarbonSubcategory =
  | TransportSubcategory
  | HomeSubcategory
  | LifestyleSubcategory
  | FoodSubcategory;

export interface CarbonEntry {
  id: string;
  userId: string;
  category: CarbonCategory;
  subcategory: CarbonSubcategory;
  amount: number;
  unit: string;
  emissionsKg: number;
  entryDate: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface CreateCarbonEntryRequest {
  category: CarbonCategory;
  subcategory: CarbonSubcategory;
  amount: number;
  unit: string;
  entryDate: string;
  metadata?: Record<string, unknown>;
}

export interface UpdateCarbonEntryRequest {
  amount?: number;
  unit?: string;
  metadata?: Record<string, unknown>;
}

export interface CarbonSummary {
  totalKg: number;
  breakdown: CategoryBreakdown[];
  trend: TrendDataPoint[];
}

export interface CategoryBreakdown {
  category: CarbonCategory;
  totalKg: number;
  percentage: number;
}

export interface TrendDataPoint {
  date: string;
  totalKg: number;
}

export type SummaryPeriod = 'daily' | 'weekly' | 'monthly' | 'annual';

export interface CarbonListParams {
  page?: number;
  limit?: number;
  from?: string;
  to?: string;
  category?: CarbonCategory;
}
