import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';

import * as reportsController from './reports.controller';

const router = Router();
router.use(authMiddleware);

router.get('/generate', reportsController.generate);

export default router;
