import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { validateRequest } from '../middleware/validate';
import {
  aiChatSchema,
  aiExplainSchema,
  aiRefactorSchema,
  aiFixErrorSchema,
  aiGenerateTestsSchema,
  aiConnectionSchema,
} from '../validations/ai.validation';
import { requireAuth } from '../middleware/auth';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use('/ai', requireAuth);
router.get('/ai/status', AiController.status);
router.use('/ai', aiRateLimiter);
router.post('/ai/check', validateRequest(aiConnectionSchema), AiController.checkConnection);

router.post('/ai/chat', validateRequest(aiChatSchema), AiController.chat);
router.post('/ai/explain', validateRequest(aiExplainSchema), AiController.explain);
router.post('/ai/refactor', validateRequest(aiRefactorSchema), AiController.refactor);
router.post('/ai/fix-error', validateRequest(aiFixErrorSchema), AiController.fixError);
router.post('/ai/generate-tests', validateRequest(aiGenerateTestsSchema), AiController.generateTests);

export default router;
