import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';

import * as predictionController from './prediction.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', predictionController.forecast);

export default router;
