import type { Request, Response } from 'express';

import { asyncHandler } from '../../middleware/error-handler.middleware';
import { sendSuccess, sendCreated } from '../../utils/response';

import * as carbonService from './carbon.service';

import type { CreateCarbonEntryRequest, UpdateCarbonEntryRequest } from '@carbonwise/shared';

export const create = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const entry = await carbonService.createEntry(userId, req.body as CreateCarbonEntryRequest);
  sendCreated(res, { entry });
});

export const getById = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const entry = await carbonService.getEntry(req.params.id!, userId);
  sendSuccess(res, { entry });
});

export const list = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const result = await carbonService.listEntries(userId, {
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 20,
    from: req.query.from as string | undefined,
    to: req.query.to as string | undefined,
    category: req.query.category as string | undefined,
  });
  sendSuccess(res, { entries: result.entries }, 200, {
    page: result.page,
    limit: result.limit,
    total: result.total,
    totalPages: Math.ceil(result.total / result.limit),
  });
});

export const update = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const entry = await carbonService.updateEntry(req.params.id!, userId, req.body as UpdateCarbonEntryRequest);
  sendSuccess(res, { entry });
});

export const remove = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  await carbonService.deleteEntry(req.params.id!, userId);
  sendSuccess(res, { message: 'Entry deleted successfully' });
});

export const summary = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const period = (req.query.period as string) || 'monthly';
  const result = await carbonService.getSummary(userId, period as 'daily' | 'weekly' | 'monthly' | 'annual');
  sendSuccess(res, result);
});
