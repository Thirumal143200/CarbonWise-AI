import dotenv from 'dotenv';
import { z } from 'zod';

// Load .env file in non-production environments
dotenv.config();

/**
 * Environment variable schema — validates ALL env vars at startup.
 * App crashes immediately if any required vars are missing or invalid.
 * This prevents runtime failures from misconfiguration.
 */
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().positive().default(3001),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z.string().min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Gemini AI (optional — graceful degradation)
  GEMINI_API_KEY: z.string().optional().default(''),

  // Resend Email (optional in dev)
  RESEND_API_KEY: z.string().optional().default(''),
  EMAIL_FROM: z.string().email().optional().default('noreply@carbonwise.app'),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.coerce.number().positive().default(900000), // 15 min
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(100),
  AUTH_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().positive().default(5),
});

export type Env = z.infer<typeof envSchema>;

function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.format();
    console.error('❌ Invalid environment variables:');
    console.error(JSON.stringify(formatted, null, 2));
    process.exit(1);
  }

  return result.data;
}

/** Validated and typed environment variables */
export const env: Env = validateEnv();

/** Whether the Gemini AI service is available */
export const isGeminiAvailable = (): boolean => env.GEMINI_API_KEY.length > 0;

/** Whether the email service is available */
export const isEmailAvailable = (): boolean => env.RESEND_API_KEY.length > 0;
