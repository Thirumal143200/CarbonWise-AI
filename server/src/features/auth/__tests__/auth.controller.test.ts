import express from 'express';
import request from 'supertest';

import { errorHandler, AppError } from '../../../middleware/error-handler.middleware';
import authRoutes from '../auth.routes';
import * as authService from '../auth.service';

// ---- Mock the service layer ----
jest.mock('../auth.service');
jest.mock('uuid', () => ({ v4: () => 'test-uuid-v4' }));
jest.mock('../../../config/env', () => ({
  env: {
    RATE_LIMIT_WINDOW_MS: 900000,
    RATE_LIMIT_MAX_REQUESTS: 100,
    AUTH_RATE_LIMIT_MAX_REQUESTS: 100, // High limit for tests
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-chars-long',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
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

const mockAuthService = authService as jest.Mocked<typeof authService>;

// ---- Create test app ----
function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/auth', authRoutes);
  app.use(errorHandler);
  return app;
}

describe('Auth Controller (Integration)', () => {
  const app = createTestApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/signup', () => {
    const validBody = {
      email: 'test@example.com',
      password: 'StrongPass1!',
      name: 'Test User',
    };

    it('should return 201 on successful signup', async () => {
      mockAuthService.signup.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: null,
          ecoScore: 0,
          xp: 0,
          level: 1,
          leaderboardOptIn: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      });

      const res = await request(app).post('/api/v1/auth/signup').send(validBody).expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('test@example.com');
      expect(res.body.data.tokens.accessToken).toBe('access-token');
    });

    it('should return 400 on invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ ...validBody, email: 'not-an-email' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'email' })]),
      );
    });

    it('should return 400 on weak password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ ...validBody, password: '123' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return 400 if password lacks special character', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ ...validBody, password: 'StrongPass1' })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.error.details).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('special character'),
          }),
        ]),
      );
    });

    it('should return 409 on duplicate email', async () => {
      mockAuthService.signup.mockRejectedValue(
        new AppError(409, 'CONFLICT', 'An account with this email already exists'),
      );

      const res = await request(app).post('/api/v1/auth/signup').send(validBody).expect(409);

      expect(res.body.error.code).toBe('CONFLICT');
    });

    it('should return 400 on missing name', async () => {
      const res = await request(app)
        .post('/api/v1/auth/signup')
        .send({ email: 'test@example.com', password: 'StrongPass1!' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    const validBody = {
      email: 'test@example.com',
      password: 'StrongPass1!',
    };

    it('should return 200 on successful login', async () => {
      mockAuthService.login.mockResolvedValue({
        user: {
          id: 'user-123',
          email: 'test@example.com',
          name: 'Test User',
          avatarUrl: null,
          ecoScore: 0,
          xp: 0,
          level: 1,
          leaderboardOptIn: false,
          createdAt: '2024-01-01T00:00:00.000Z',
          updatedAt: '2024-01-01T00:00:00.000Z',
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token',
        },
      });

      const res = await request(app).post('/api/v1/auth/login').send(validBody).expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.tokens).toBeDefined();
    });

    it('should return 401 on invalid credentials', async () => {
      mockAuthService.login.mockRejectedValue(
        new AppError(401, 'UNAUTHORIZED', 'Invalid email or password'),
      );

      const res = await request(app).post('/api/v1/auth/login').send(validBody).expect(401);

      expect(res.body.error.message).toBe('Invalid email or password');
    });

    it('should return 400 on missing email', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ password: 'StrongPass1!' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/refresh', () => {
    it('should return new tokens on valid refresh', async () => {
      mockAuthService.refreshTokens.mockResolvedValue({
        accessToken: 'new-access',
        refreshToken: 'new-refresh',
      });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' })
        .expect(200);

      expect(res.body.data.accessToken).toBe('new-access');
      expect(res.body.data.refreshToken).toBe('new-refresh');
    });

    it('should return 400 on missing refreshToken', async () => {
      const res = await request(app).post('/api/v1/auth/refresh').send({}).expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/forgot-password', () => {
    it('should always return 200 regardless of email existence', async () => {
      mockAuthService.forgotPassword.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'anyone@example.com' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.message).toContain('If an account exists');
    });
  });

  describe('POST /api/v1/auth/reset-password', () => {
    it('should return 200 on successful reset', async () => {
      mockAuthService.resetPassword.mockResolvedValue(undefined);

      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'NewStrong1!' })
        .expect(200);

      expect(res.body.data.message).toContain('Password reset successfully');
    });

    it('should return 400 on weak new password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/reset-password')
        .send({ token: 'valid-token', newPassword: 'weak' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Response envelope consistency', () => {
    it('should always return { success, data, error } shape on success', async () => {
      mockAuthService.login.mockResolvedValue({
        user: {
          id: '1',
          email: 'a@b.com',
          name: 'N',
          avatarUrl: null,
          ecoScore: 0,
          xp: 0,
          level: 1,
          leaderboardOptIn: false,
          createdAt: '',
          updatedAt: '',
        },
        tokens: { accessToken: 'a', refreshToken: 'r' },
      });

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'a@b.com', password: 'x' })
        .expect(200);

      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('data');
      expect(res.body).toHaveProperty('error', null);
    });

    it('should always return { success, data, error } shape on error', async () => {
      const res = await request(app).post('/api/v1/auth/signup').send({ email: 'bad' }).expect(400);

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('data', null);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toHaveProperty('code');
      expect(res.body.error).toHaveProperty('message');
    });
  });
});
