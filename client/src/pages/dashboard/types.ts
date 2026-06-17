export interface DashboardData {
  daily: { totalKg: number; changePercent: number; entryCount: number };
  weekly: { totalKg: number; changePercent: number; entryCount: number };
  monthly: { totalKg: number; changePercent: number; entryCount: number };
  annual: { totalKg: number; changePercent: number; entryCount: number };
  breakdown: { category: string; totalKg: number; percentage: number }[];
  recentEntries: {
    id: string;
    category: string;
    subcategory: string;
    emissionsKg: number;
    entryDate: string;
  }[];
  comparisonWithAverage: { userKg: number; nationalAverageKg: number; percentBelowAverage: number };
}
