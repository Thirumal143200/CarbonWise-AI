import * as tokenUtil from '../token';

jest.mock('../../config/env', () => ({
  env: {
    JWT_SECRET: 'test-secret-that-is-at-least-32-chars-long',
    JWT_REFRESH_SECRET: 'test-refresh-secret-that-is-at-least-32-chars-long',
    JWT_ACCESS_EXPIRY: '15m',
    JWT_REFRESH_EXPIRY: '7d',
  },
}));

describe('Token Utilities', () => {
  const userPayload = { userId: 'u123', email: 'test@example.com' };
  const refreshPayload = { userId: 'u123', tokenId: 't456' };

  it('should generate and verify access tokens successfully', () => {
    const token = tokenUtil.generateAccessToken(userPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = tokenUtil.verifyAccessToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(userPayload.userId);
    expect(decoded?.email).toBe(userPayload.email);
  });

  it('should generate and verify refresh tokens successfully', () => {
    const token = tokenUtil.generateRefreshToken(refreshPayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = tokenUtil.verifyRefreshToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.userId).toBe(refreshPayload.userId);
    expect(decoded?.tokenId).toBe(refreshPayload.tokenId);
  });

  it('should return null on invalid access token verification', () => {
    const decoded = tokenUtil.verifyAccessToken('invalid-token-string');
    expect(decoded).toBeNull();
  });

  it('should return null on invalid refresh token verification', () => {
    const decoded = tokenUtil.verifyRefreshToken('invalid-token-string');
    expect(decoded).toBeNull();
  });

  it('should correctly hash tokens with SHA-256', () => {
    const sampleToken = 'token-to-hash';
    const hash = tokenUtil.hashToken(sampleToken);
    expect(hash).toBeDefined();
    expect(hash.length).toBe(64); // SHA-256 hex digest length is 64 chars
    expect(hash).toBe(tokenUtil.hashToken(sampleToken)); // Deterministic
  });

  it('should generate secure random tokens', () => {
    const rand1 = tokenUtil.generateRandomToken();
    const rand2 = tokenUtil.generateRandomToken(16);

    expect(rand1).toBeDefined();
    expect(rand1.length).toBe(64); // Default 32 bytes = 64 hex characters
    expect(rand2.length).toBe(32); // 16 bytes = 32 hex characters
    expect(rand1).not.toBe(rand2);
  });
});
