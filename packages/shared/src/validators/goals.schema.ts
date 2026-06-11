import { z } from 'zod';

// ============================================
// Goals Validation Schemas
// ============================================

export const createGoalSchema = z
  .object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200).trim(),
    targetReductionPct: z
      .number()
      .positive('Target must be positive')
      .max(100, 'Target cannot exceed 100%'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'End date must be after start date',
    path: ['endDate'],
  });

export const updateGoalSchema = z.object({
  title: z.string().min(3).max(200).trim().optional(),
  targetReductionPct: z.number().positive().max(100).optional(),
  status: z.enum(['active', 'completed', 'failed', 'cancelled']).optional(),
});

export type CreateGoalInput = z.infer<typeof createGoalSchema>;
export type UpdateGoalInput = z.infer<typeof updateGoalSchema>;
