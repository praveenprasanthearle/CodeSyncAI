import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
} from '../validations/auth.validation';

const router = Router();

// Public auth routes (rate limited)
router.post(
  '/register',
  authRateLimiter,
  validateRequest(registerSchema),
  AuthController.register
);

router.post(
  '/login',
  authRateLimiter,
  validateRequest(loginSchema),
  AuthController.login
);

router.post(
  '/refresh',
  authRateLimiter,
  AuthController.refresh
);

router.post(
  '/logout',
  AuthController.logout
);

// Protected user routes
router.get(
  '/me',
  requireAuth,
  AuthController.getMe
);

router.patch(
  '/profile',
  requireAuth,
  validateRequest(updateProfileSchema),
  AuthController.updateProfile
);

export default router;
