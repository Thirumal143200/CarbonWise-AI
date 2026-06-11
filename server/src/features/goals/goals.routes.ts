import { createGoalSchema, updateGoalSchema } from '@carbonwise/shared';
import { Router } from 'express';


import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

import * as goalsController from './goals.controller';

const router = Router();
router.use(authMiddleware);

router.post('/', validate(createGoalSchema), goalsController.create);
router.get('/', goalsController.list);
router.get('/:id', goalsController.getById);
router.put('/:id', validate(updateGoalSchema), goalsController.update);
router.delete('/:id', goalsController.remove);

export default router;
