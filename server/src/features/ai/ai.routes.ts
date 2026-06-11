import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

import * as aiController from './ai.controller';

const router = Router();
router.use(authMiddleware);

router.post('/recommendations', validate(aiController.recommendationSchema), aiController.generateRecommendation);
router.get('/recommendations', aiController.listRecommendations);
router.post('/chat', validate(aiController.chatSchema), aiController.chat);

export default router;
