// ============================================
// API Response Types — Consistent envelope
// ============================================

/** Standard API success response */
export interface ApiResponse<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
  error: null;
}

/** Standard API error response */
export interface ApiErrorResponse {
  success: false;
  data: null;
  error: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: FieldError[];
}

export interface FieldError {
  field: string;
  message: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/** Query params for paginated list endpoints */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/** Date range filter */
export interface DateRangeParams {
  from?: string;
  to?: string;
}

/** Standard API error codes */
export const API_ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  GEMINI_UNAVAILABLE: 'GEMINI_UNAVAILABLE',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];
