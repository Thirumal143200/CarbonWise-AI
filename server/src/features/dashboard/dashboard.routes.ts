import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';

import * as dashboardController from './dashboard.controller';

const router = Router();
router.use(authMiddleware);

router.get('/overview', dashboardController.overview);
router.get('/trends', dashboardController.trends);

export default router;
