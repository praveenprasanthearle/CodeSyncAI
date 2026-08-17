import { Router } from 'express';
import { ChatController } from '../controllers/chat.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/projectAuth';
import { validateRequest } from '../middleware/validate';
import { sendMessageSchema } from '../validations/chat.validation';

const router = Router();

// Project message collection endpoints
router.get(
  '/projects/:id/messages',
  requireProjectAccess('viewer'),
  ChatController.getMessages
);

router.post(
  '/projects/:id/messages',
  requireAuth,
  requireProjectAccess('viewer'),
  validateRequest(sendMessageSchema),
  ChatController.sendMessage
);

// Individual message endpoints
router.delete(
  '/messages/:id',
  requireAuth,
  ChatController.deleteMessage
);

export default router;
