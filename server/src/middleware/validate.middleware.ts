import type { Request, Response, NextFunction } from 'express';
import type { ZodSchema } from 'zod';

import { sendError } from '../utils/response';

type ValidationTarget = 'body' | 'query' | 'params';

/**
 * Zod validation middleware factory.
 * Validates the specified request property (body, query, or params)
 * against a Zod schema. Returns structured field-level errors on failure.
 *
 * Usage:
 *   router.post('/endpoint', validate(mySchema, 'body'), handler)
 */
export function validate(schema: ZodSchema, target: ValidationTarget = 'body') {
  return (req: Request, res: Response, next: NextFunction): void => {
    const data = req[target] as unknown;
    const result = schema.safeParse(data);

    if (!result.success) {
      const zodError = result.error;
      const details = zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));

      sendError(res, 'VALIDATION_ERROR', 'Input validation failed', 400, details);
      return;
    }

    // Replace with parsed/transformed data (coercion, defaults, etc.)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    req[target] = result.data;
    next();
  };
}
