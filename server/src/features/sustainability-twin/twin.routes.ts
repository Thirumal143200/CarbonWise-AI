import { Router } from 'express';

import { authMiddleware } from '../../middleware/auth.middleware';

import * as twinController from './twin.controller';

const router = Router();
router.use(authMiddleware);

router.get('/', twinController.getTwin);

export default router;
