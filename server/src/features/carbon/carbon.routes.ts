import { createCarbonEntrySchema, updateCarbonEntrySchema, carbonListParamsSchema, carbonSummaryParamsSchema } from '@carbonwise/shared';
import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

import * as carbonController from './carbon.controller';

const router = Router();

// All carbon routes require authentication
router.use(authMiddleware);

router.post('/', validate(createCarbonEntrySchema), carbonController.create);
router.get('/', validate(carbonListParamsSchema, 'query'), carbonController.list);
router.get('/summary', validate(carbonSummaryParamsSchema, 'query'), carbonController.summary);
router.get('/:id', carbonController.getById);
router.put('/:id', validate(updateCarbonEntrySchema), carbonController.update);
router.delete('/:id', carbonController.remove);

export default router;
