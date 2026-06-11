import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';

import * as gamificationController from './gamification.controller';

const router = Router();
router.use(authMiddleware);

router.get('/profile', gamificationController.profile);
router.get('/achievements', gamificationController.achievements);
router.get('/leaderboard', gamificationController.leaderboard);

export default router;
