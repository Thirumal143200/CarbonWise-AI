import cors from 'cors';
import express, { type Request, type Response } from 'express';

import { corsOptions } from './config/cors';
import { checkDatabaseHealth } from './config/database';

// ---- Feature Routes ----
import aiRoutes from './features/ai/ai.routes';
import authRoutes from './features/auth/auth.routes';
import carbonRoutes from './features/carbon/carbon.routes';
import challengesRoutes from './features/challenges/challenges.routes';
import dashboardRoutes from './features/dashboard/dashboard.routes';
import educationRoutes from './features/education/education.routes';
import gamificationRoutes from './features/gamification/gamification.routes';
import goalsRoutes from './features/goals/goals.routes';
import predictionRoutes from './features/predictions/prediction.routes';
import reportsRoutes from './features/reports/reports.routes';
import simulatorRoutes from './features/simulator/simulator.routes';
import twinRoutes from './features/sustainability-twin/twin.routes';
import { errorHandler } from './middleware/error-handler.middleware';
import { generalRateLimiter } from './middleware/rate-limiter.middleware';
import { securityHeaders } from './middleware/security.middleware';

/**
 * Express application factory.
 * Assembles the middleware chain and mounts routes.
 *
 * Middleware order matters:
 * 1. Security headers (Helmet)
 * 2. CORS
 * 3. Body parsing
 * 4. Rate limiting
 * 5. Routes
 * 6. Error handler (must be last)
 */
export function createApp(): express.Application {
  const app = express();

  // ---- Security ----
  app.use(securityHeaders);
  app.use(cors(corsOptions));

  // ---- Body Parsing ----
  app.use(express.json({ limit: '10kb' })); // Limit body size to prevent DoS
  app.use(express.urlencoded({ extended: false }));

  // ---- Rate Limiting ----
  app.use(generalRateLimiter);

  // ---- Trust proxy (for Render/Vercel behind load balancer) ----
  app.set('trust proxy', 1);

  // ---- Health Check ----
  app.get('/api/v1/health', (req: Request, res: Response, next) => {
    Promise.resolve().then(async () => {
      const dbHealthy = await checkDatabaseHealth();
      const status = dbHealthy ? 200 : 503;
      res.status(status).json({
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          database: dbHealthy ? 'connected' : 'disconnected',
        },
      });
    }).catch(next);
  });

  // ---- API Routes ----
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/carbon', carbonRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);
  app.use('/api/v1/ai', aiRoutes);
  app.use('/api/v1/predictions', predictionRoutes);
  app.use('/api/v1/goals', goalsRoutes);
  app.use('/api/v1/gamification', gamificationRoutes);
  app.use('/api/v1/challenges', challengesRoutes);
  app.use('/api/v1/reports', reportsRoutes);
  app.use('/api/v1/education', educationRoutes);
  app.use('/api/v1/twin', twinRoutes);
  app.use('/api/v1/simulator', simulatorRoutes);

  // ---- 404 Handler ----
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      data: null,
      error: {
        code: 'NOT_FOUND',
        message: 'The requested endpoint does not exist',
      },
    });
  });

  // ---- Global Error Handler (must be last) ----
  app.use(errorHandler);

  return app;
}
