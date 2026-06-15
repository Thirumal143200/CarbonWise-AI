import bcrypt from 'bcrypt';

import { AppError } from '../../../middleware/error-handler.middleware';
import * as tokenUtils from '../../../utils/token';
import * as authRepo from '../auth.repository';
import * as authService from '../auth.service';

// ---- Mock Dependencies ----

jest.mock('bcrypt', () => {
  const mockBcrypt = {
    hash: jest.fn().mockResolvedValue('$2b$12$mockedpassword'),
    compare: jest.fn().mockResolvedValue(true),
  };
  return {
    __esModule: true,
    default: mockBcrypt,
    ...mockBcrypt,
  };
});
jest.mock('../auth.repository');
jest.mock('../../../utils/token');
jest.mock('../../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-chars-long',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
    CORS_ORIGIN: 'http://localhost:5173',
    RESEND_API_KEY: '',
    EMAIL_FROM: 'test@test.com',
  },
  isEmailAvailable: () => false,
}));
jest.mock('../../../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));
jest.mock('uuid', () => ({ v4: () => 'test-uuid-v4' }));

const mockAuthRepo = authRepo as jest.Mocked<typeof authRepo>;
const mockTokenUtils = tokenUtils as jest.Mocked<typeof tokenUtils>;

// ---- Test Data ----

const mockUserRow: authRepo.UserRow = {
  id: 'user-123',
  email: 'test@example.com',
  password_hash: '$2b$12$hashedpassword',
  name: 'Test User',
  avatar_url: null,
  eco_score: 0,
  xp: 0,
  level: 1,
  leaderboard_opt_in: false,
  created_at: new Date('2024-01-01'),
  updated_at: new Date('2024-01-01'),
};

// ---- Tests ----

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signup', () => {
    it('should create a new user and return tokens', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthRepo.createUser.mockResolvedValue(mockUserRow);
      mockAuthRepo.storeRefreshToken.mockResolvedValue(undefined);
      mockTokenUtils.generateAccessToken.mockReturnValue('access-token');
      mockTokenUtils.generateRefreshToken.mockReturnValue('refresh-token');
      mockTokenUtils.hashToken.mockReturnValue('hashed-refresh');

      const result = await authService.signup('test@example.com', 'Password1!', 'Test User');

      expect(result.user.email).toBe('test@example.com');
      expect(result.user.name).toBe('Test User');
      expect(result.tokens.accessToken).toBe('access-token');
      expect(result.tokens.refreshToken).toBe('refresh-token');
      expect(mockAuthRepo.createUser).toHaveBeenCalledWith(
        'test@example.com',
        expect.any(String), // bcrypt hash
        'Test User',
      );
      // Verify password was hashed (not stored as plaintext)
      const hashArg = mockAuthRepo.createUser.mock.calls[0]![1];
      expect(hashArg).not.toBe('Password1!');
    });

    it('should throw CONFLICT if email already exists', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(mockUserRow);

      await expect(
        authService.signup('test@example.com', 'Password1!', 'Test User'),
      ).rejects.toThrow(AppError);

      await expect(
        authService.signup('test@example.com', 'Password1!', 'Test User'),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: 'CONFLICT',
      });
    });

    it('should hash the password with bcrypt', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);
      mockAuthRepo.createUser.mockResolvedValue(mockUserRow);
      mockAuthRepo.storeRefreshToken.mockResolvedValue(undefined);
      mockTokenUtils.generateAccessToken.mockReturnValue('at');
      mockTokenUtils.generateRefreshToken.mockReturnValue('rt');
      mockTokenUtils.hashToken.mockReturnValue('hrt');

      const hashSpy = jest.spyOn(bcrypt, 'hash') as jest.SpyInstance;
      hashSpy.mockResolvedValue('$2b$12$mocked-hash' as never);

      await authService.signup('new@example.com', 'Password1!', 'New User');

      expect(hashSpy).toHaveBeenCalledWith('Password1!', 12);
      hashSpy.mockClear();
    });
  });

  describe('login', () => {
    it('should return user and tokens on valid credentials', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(mockUserRow);
      mockAuthRepo.storeRefreshToken.mockResolvedValue(undefined);
      mockTokenUtils.generateAccessToken.mockReturnValue('access-token');
      mockTokenUtils.generateRefreshToken.mockReturnValue('refresh-token');
      mockTokenUtils.hashToken.mockReturnValue('hashed-refresh');

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true as never);

      const result = await authService.login('test@example.com', 'Password1!');

      expect(result.user.email).toBe('test@example.com');
      expect(result.tokens.accessToken).toBe('access-token');
    });

    it('should throw UNAUTHORIZED on invalid email (anti-enumeration)', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);

      await expect(
        authService.login('nonexistent@example.com', 'Password1!'),
      ).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });

    it('should throw UNAUTHORIZED on wrong password (same message as invalid email)', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(mockUserRow);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false as never);

      await expect(authService.login('test@example.com', 'WrongPassword1!')).rejects.toMatchObject({
        statusCode: 401,
        message: 'Invalid email or password',
      });
    });
  });

  describe('refreshTokens', () => {
    it('should rotate tokens on valid refresh', async () => {
      mockTokenUtils.verifyRefreshToken.mockReturnValue({
        userId: 'user-123',
        tokenId: 'old-token-id',
      });
      mockTokenUtils.hashToken.mockReturnValue('hashed-old-refresh');
      mockAuthRepo.findRefreshToken.mockResolvedValue({
        id: 'rt-id',
        user_id: 'user-123',
        token_hash: 'hashed-old-refresh',
        expires_at: new Date(Date.now() + 86400000),
        revoked: false,
        created_at: new Date(),
      });
      mockAuthRepo.revokeRefreshToken.mockResolvedValue(undefined);
      mockAuthRepo.findUserById.mockResolvedValue(mockUserRow);
      mockAuthRepo.storeRefreshToken.mockResolvedValue(undefined);
      mockTokenUtils.generateAccessToken.mockReturnValue('new-access');
      mockTokenUtils.generateRefreshToken.mockReturnValue('new-refresh');

      const result = await authService.refreshTokens('old-refresh-token');

      expect(result.accessToken).toBe('new-access');
      expect(result.refreshToken).toBe('new-refresh');
      expect(mockAuthRepo.revokeRefreshToken).toHaveBeenCalledWith('hashed-old-refresh');
    });

    it('should revoke ALL tokens on replay attack (token reuse)', async () => {
      mockTokenUtils.verifyRefreshToken.mockReturnValue({
        userId: 'user-123',
        tokenId: 'old-token-id',
      });
      mockTokenUtils.hashToken.mockReturnValue('hashed-reused');
      mockAuthRepo.findRefreshToken.mockResolvedValue(null); // Token not found = already used

      await expect(authService.refreshTokens('reused-token')).rejects.toMatchObject({
        statusCode: 401,
      });

      // Security: all tokens for this user should be revoked
      expect(mockAuthRepo.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-123');
    });

    it('should throw UNAUTHORIZED on invalid JWT', async () => {
      mockTokenUtils.verifyRefreshToken.mockReturnValue(null);

      await expect(authService.refreshTokens('invalid-jwt')).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });

  describe('forgotPassword', () => {
    it('should not reveal whether email exists', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(null);

      // Should NOT throw even for non-existent email
      await expect(authService.forgotPassword('nonexistent@example.com')).resolves.toBeUndefined();
    });

    it('should generate and store a reset token for existing users', async () => {
      mockAuthRepo.findUserByEmail.mockResolvedValue(mockUserRow);
      mockAuthRepo.storePasswordResetToken.mockResolvedValue(undefined);
      mockTokenUtils.generateRandomToken.mockReturnValue('random-token');
      mockTokenUtils.hashToken.mockReturnValue('hashed-random');

      await authService.forgotPassword('test@example.com');

      expect(mockAuthRepo.storePasswordResetToken).toHaveBeenCalledWith(
        'user-123',
        'hashed-random',
        expect.any(Date),
      );
    });
  });

  describe('resetPassword', () => {
    it('should update password and revoke all refresh tokens', async () => {
      mockTokenUtils.hashToken.mockReturnValue('hashed-reset');
      mockAuthRepo.findPasswordResetToken.mockResolvedValue({
        id: 'prt-1',
        user_id: 'user-123',
        token_hash: 'hashed-reset',
        expires_at: new Date(Date.now() + 3600000),
        used: false,
        created_at: new Date(),
      });
      mockAuthRepo.updateUserPassword.mockResolvedValue(undefined);
      mockAuthRepo.markPasswordResetTokenUsed.mockResolvedValue(undefined);
      mockAuthRepo.revokeAllUserRefreshTokens.mockResolvedValue(undefined);

      await authService.resetPassword('reset-token', 'NewPassword1!');

      expect(mockAuthRepo.updateUserPassword).toHaveBeenCalledWith('user-123', expect.any(String));
      expect(mockAuthRepo.markPasswordResetTokenUsed).toHaveBeenCalledWith('hashed-reset');
      expect(mockAuthRepo.revokeAllUserRefreshTokens).toHaveBeenCalledWith('user-123');
    });

    it('should throw on invalid/expired reset token', async () => {
      mockTokenUtils.hashToken.mockReturnValue('hashed-invalid');
      mockAuthRepo.findPasswordResetToken.mockResolvedValue(null);

      await expect(
        authService.resetPassword('invalid-token', 'NewPassword1!'),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
      });
    });
  });

  describe('getProfile', () => {
    it('should return public user data', async () => {
      mockAuthRepo.findUserById.mockResolvedValue(mockUserRow);

      const user = await authService.getProfile('user-123');

      expect(user.id).toBe('user-123');
      expect(user.email).toBe('test@example.com');
      // Should NOT contain password_hash
      expect((user as unknown as Record<string, unknown>).password_hash).toBeUndefined();
      expect((user as unknown as Record<string, unknown>).passwordHash).toBeUndefined();
    });

    it('should throw NOT_FOUND for non-existent user', async () => {
      mockAuthRepo.findUserById.mockResolvedValue(null);

      await expect(authService.getProfile('nonexistent')).rejects.toMatchObject({
        statusCode: 404,
        code: 'NOT_FOUND',
      });
    });
  });

  describe('logout', () => {
    it('should revoke the refresh token', async () => {
      mockTokenUtils.hashToken.mockReturnValue('hashed-rt');
      mockAuthRepo.revokeRefreshToken.mockResolvedValue(undefined);

      await authService.logout('refresh-token');

      expect(mockAuthRepo.revokeRefreshToken).toHaveBeenCalledWith('hashed-rt');
    });
  });
});
