import { Router } from 'express';
import { FileController } from '../controllers/file.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/projectAuth';
import { validateRequest } from '../middleware/validate';
import { createFileNodeSchema } from '../validations/file.validation';

const router = Router();

// Project file collection endpoints
router.get(
  '/projects/:id/files',
  requireProjectAccess('viewer'),
  FileController.getTree
);

router.get(
  '/projects/:id/files/flat',
  requireProjectAccess('viewer'),
  FileController.getFlat
);

router.post(
  '/projects/:id/files',
  requireAuth,
  requireProjectAccess('editor'),
  validateRequest(createFileNodeSchema),
  FileController.create
);

// Individual file item endpoints
router.get(
  '/files/:id',
  requireAuth,
  FileController.getById
);

router.put(
  '/files/:id',
  requireAuth,
  FileController.update
);

router.delete(
  '/files/:id',
  requireAuth,
  FileController.delete
);

export default router;
