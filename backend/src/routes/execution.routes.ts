import { Router } from 'express';
import { ExecutionController } from '../controllers/execution.controller';
import { validateRequest } from '../middleware/validate';
import { executeCodeSchema } from '../validations/execution.validation';
import { requireAuth } from '../middleware/auth';
import { executionRateLimiter } from '../middleware/rateLimiter';

const router = Router();

router.post('/execution/run', requireAuth, executionRateLimiter, validateRequest(executeCodeSchema), ExecutionController.runCode);
router.get('/execution/languages', ExecutionController.getLanguages);

export default router;
