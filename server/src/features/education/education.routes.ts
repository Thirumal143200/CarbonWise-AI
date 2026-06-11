import { Router } from 'express';

import { authMiddleware, optionalAuthMiddleware } from '../../middleware/auth.middleware';

import * as educationController from './education.controller';

const router = Router();

// Public: list and view content
router.get('/', optionalAuthMiddleware, educationController.list);
router.get('/:slug', optionalAuthMiddleware, educationController.getBySlug);

// Protected: answer quizzes (requires auth for XP tracking)
router.post('/quiz/:questionId/answer', authMiddleware, educationController.answerQuiz);

export default router;
