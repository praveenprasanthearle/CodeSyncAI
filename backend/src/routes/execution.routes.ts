import { Router } from 'express';
import { ExecutionController } from '../controllers/execution.controller';
import { validateRequest } from '../middleware/validate';
import { executeCodeSchema } from '../validations/execution.validation';

const router = Router();

router.post('/execution/run', validateRequest(executeCodeSchema), ExecutionController.runCode);
router.get('/execution/languages', ExecutionController.getLanguages);

export default router;
