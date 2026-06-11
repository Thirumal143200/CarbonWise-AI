import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';
import { validate } from '../../middleware/validate.middleware';

import * as simulatorController from './simulator.controller';

const router = Router();
router.use(authMiddleware);

router.post('/run', validate(simulatorController.simulationSchema), simulatorController.simulate);
router.get('/templates', simulatorController.templates);
router.get('/history', simulatorController.history);

export default router;
