// ============================================
// @carbonwise/shared — Barrel Export
// ============================================

// Types
export type {
  ApiResponse,
  ApiErrorResponse,
  ApiError,
  FieldError,
  PaginationMeta,
  PaginationParams,
  DateRangeParams,
  ApiErrorCode,
} from './types/api';
export { API_ERROR_CODES } from './types/api';

export type {
  User,
  PublicUser,
  AuthTokens,
  LoginRequest,
  SignupRequest,
  RefreshTokenRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  UpdateProfileRequest,
  AuthResponse,
  PasswordResetToken,
} from './types/auth';

export type {
  CarbonCategory,
  CarbonSubcategory,
  TransportSubcategory,
  HomeSubcategory,
  LifestyleSubcategory,
  FoodSubcategory,
  CarbonEntry,
  CreateCarbonEntryRequest,
  UpdateCarbonEntryRequest,
  CarbonSummary,
  CategoryBreakdown,
  TrendDataPoint,
  SummaryPeriod,
  CarbonListParams,
} from './types/carbon';

export type {
  DashboardOverview,
  PeriodSummary,
  ComparisonMetric,
  DashboardTrends,
} from './types/dashboard';

export type {
  GamificationProfile,
  Achievement,
  AchievementCriteriaType,
  UserAchievement,
  LeaderboardEntry,
  Goal,
  GoalStatus,
  CreateGoalRequest,
  UpdateGoalRequest,
  Challenge,
  UserChallenge,
  ChallengeStatus,
} from './types/gamification';
export { LEVEL_THRESHOLDS, LEVEL_RANKS } from './types/gamification';

export type {
  ForecastRequest,
  ForecastHorizon,
  ForecastResponse,
  ForecastDataPoint,
  ConfidenceMetrics,
  ConfidenceFactor,
  ForecastModelInput,
  SeasonalPattern,
} from './types/forecast';

export type {
  SustainabilityTwin,
  BehaviorProfile,
  TransportBehavior,
  EnergyBehavior,
  DietBehavior,
  LifestyleBehavior,
  GapAnalysis,
  GapCategory,
  PriorityAction,
  ProjectedSavings,
} from './types/sustainability-twin';

export type {
  SimulationRequest,
  SimulationScenario,
  SimulationAction,
  SimulationActionType,
  SimulationParams,
  SimulationResponse,
  SimulationResult,
  SimulationBreakdown,
  FeasibilityScore,
  CombinedImpact,
  SimulationTemplate,
} from './types/simulation';
export { SIMULATION_TEMPLATES } from './types/simulation';

// Constants
export {
  TRANSPORT_FACTORS,
  HOME_FACTORS,
  LIFESTYLE_FACTORS,
  FOOD_FACTORS,
  getEmissionFactor,
  calculateEmissions,
  EQUIVALENTS,
} from './constants/emissions-factors';
export type { EmissionFactor } from './constants/emissions-factors';

export {
  CARBON_CATEGORIES,
  SUBCATEGORIES,
  CATEGORY_LABELS,
  SUBCATEGORY_LABELS,
  CATEGORY_ICONS,
  SUBCATEGORY_ICONS,
  NATIONAL_AVERAGES,
  SUBCATEGORY_UNITS,
} from './constants/categories';

// Validators
export {
  signupSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  updateProfileSchema,
} from './validators/auth.schema';
export type {
  SignupInput,
  LoginInput,
  RefreshTokenInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  UpdateProfileInput,
} from './validators/auth.schema';

export {
  createCarbonEntrySchema,
  updateCarbonEntrySchema,
  carbonListParamsSchema,
  carbonSummaryParamsSchema,
} from './validators/carbon.schema';
export type {
  CreateCarbonEntryInput,
  UpdateCarbonEntryInput,
  CarbonListParamsInput,
  CarbonSummaryParamsInput,
} from './validators/carbon.schema';

export { createGoalSchema, updateGoalSchema } from './validators/goals.schema';
export type { CreateGoalInput, UpdateGoalInput } from './validators/goals.schema';
