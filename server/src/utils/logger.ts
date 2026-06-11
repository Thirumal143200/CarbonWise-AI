import pino from 'pino';

import { env } from '../config/env';

/**
 * Structured logger using Pino.
 * - JSON in production for log aggregation
 * - Pretty-printed in development for readability
 * - Includes timestamp, level, and context
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.body.password', 'req.body.refreshToken'],
    censor: '[REDACTED]',
  },
});
