import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';

import * as challengesController from './challenges.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', challengesController.list);
router.post('/:id/join', challengesController.join);
router.put('/:id/progress', challengesController.updateProgress);
router.get('/active', challengesController.active);

export default router;
