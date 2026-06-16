import { z } from 'zod';

import { CARBON_CATEGORIES, SUBCATEGORIES } from '../constants/categories';

// ============================================
// Carbon Entry Validation Schemas
// ============================================

const allSubcategories = Object.values(SUBCATEGORIES).flat();

export const createCarbonEntrySchema = z
  .object({
    category: z.enum(CARBON_CATEGORIES, {
      errorMap: () => ({ message: `Category must be one of: ${CARBON_CATEGORIES.join(', ')}` }),
    }),
    subcategory: z.string().refine((val) => allSubcategories.includes(val as never), {
      message: `Invalid subcategory`,
    }),
    amount: z.number().positive('Amount must be positive').max(100000, 'Amount too large'),
    unit: z.string().min(1).max(20),
    entryDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
      .refine(
        (val) => {
          const todayStr = new Date().toISOString().split('T')[0]!;
          return val <= todayStr;
        },
        {
          message: 'Entry date cannot be in the future',
        },
      ),
    metadata: z.record(z.unknown()).optional(),
  })
  .refine(
    (data) => {
      const validSubs = SUBCATEGORIES[data.category] as readonly string[];
      return validSubs.includes(data.subcategory);
    },
    {
      message: 'Subcategory does not match category',
      path: ['subcategory'],
    },
  );

export const updateCarbonEntrySchema = z.object({
  amount: z.number().positive('Amount must be positive').max(100000).optional(),
  unit: z.string().min(1).max(20).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const carbonListParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  category: z.enum(CARBON_CATEGORIES).optional(),
});

export const carbonSummaryParamsSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'annual']).default('monthly'),
});

export type CreateCarbonEntryInput = z.infer<typeof createCarbonEntrySchema>;
export type UpdateCarbonEntryInput = z.infer<typeof updateCarbonEntrySchema>;
export type CarbonListParamsInput = z.infer<typeof carbonListParamsSchema>;
export type CarbonSummaryParamsInput = z.infer<typeof carbonSummaryParamsSchema>;
