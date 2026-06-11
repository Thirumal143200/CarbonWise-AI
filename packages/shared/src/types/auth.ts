// ============================================
// Authentication Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  ecoScore: number;
  xp: number;
  level: number;
  leaderboardOptIn: boolean;
  createdAt: string;
  updatedAt: string;
}

/** User data returned to the client (never includes password hash) */
export type PublicUser = Omit<User, 'leaderboardOptIn'> & {
  leaderboardOptIn: boolean;
};

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface UpdateProfileRequest {
  name?: string;
  avatarUrl?: string;
  leaderboardOptIn?: boolean;
}

export interface AuthResponse {
  user: PublicUser;
  tokens: AuthTokens;
}

export interface PasswordResetToken {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: string;
  used: boolean;
  createdAt: string;
}
