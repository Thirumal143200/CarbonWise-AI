/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@carbonwise/shared$': '<rootDir>/../packages/shared/src',
  },
  collectCoverageFrom: [
    'src/features/auth/auth.service.ts',
    'src/features/auth/auth.controller.ts',
    'src/features/carbon/carbon.service.ts',
    'src/features/carbon/carbon.controller.ts',
    'src/features/goals/goals.controller.ts',
    'src/middleware/auth.middleware.ts',
    'src/middleware/security.middleware.ts',
    'src/middleware/validate.middleware.ts',
    'src/middleware/error-handler.middleware.ts',
    'src/utils/token.ts',
    'src/utils/response.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
  clearMocks: true,
  restoreMocks: true,
};

module.exports = config;
