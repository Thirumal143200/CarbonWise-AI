export interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

export interface RecommendationItem {
  title: string;
  impact: string;
  description: string;
}

export interface WeeklyPlanDay {
  day: string;
  action: string;
  impact: string;
}

export interface BehavioralInsight {
  pattern: string;
  suggestion: string;
  potentialSavingsKg: number;
}

export interface RecommendationResult {
  recommendations?: RecommendationItem[];
  days?: WeeklyPlanDay[];
  weeklyTotal?: string;
  insights?: BehavioralInsight[];
}

export interface RecommendationResponse {
  recommendation: RecommendationResult;
  type: string;
}
