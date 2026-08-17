import { Router } from 'express';
import { AiController } from '../controllers/ai.controller';
import { validateRequest } from '../middleware/validate';
import {
  aiChatSchema,
  aiExplainSchema,
  aiRefactorSchema,
  aiFixErrorSchema,
  aiGenerateTestsSchema,
} from '../validations/ai.validation';

const router = Router();

router.post('/ai/chat', validateRequest(aiChatSchema), AiController.chat);
router.post('/ai/explain', validateRequest(aiExplainSchema), AiController.explain);
router.post('/ai/refactor', validateRequest(aiRefactorSchema), AiController.refactor);
router.post('/ai/fix-error', validateRequest(aiFixErrorSchema), AiController.fixError);
router.post('/ai/generate-tests', validateRequest(aiGenerateTestsSchema), AiController.generateTests);

export default router;
