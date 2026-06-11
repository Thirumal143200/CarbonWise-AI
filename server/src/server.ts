import { createApp } from './app';
import { closeDatabasePool } from './config/database';
import { env } from './config/env';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 CarbonWise API running on port ${env.PORT}`);
  logger.info(`📍 Environment: ${env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${env.PORT}/api/v1/health`);
});

// ---- Graceful Shutdown ----
function gracefulShutdown(signal: string): void {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    Promise.resolve().then(async () => {
      logger.info('HTTP server closed');
      await closeDatabasePool();
      logger.info('Graceful shutdown complete');
      process.exit(0);
    }).catch((err: unknown) => {
      logger.error({ err: err as Error }, 'Error during database pool close');
      process.exit(1);
    });
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => { gracefulShutdown('SIGTERM'); });
process.on('SIGINT', () => { gracefulShutdown('SIGINT'); });

// Handle unhandled rejections
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled promise rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception — shutting down');
  process.exit(1);
});
