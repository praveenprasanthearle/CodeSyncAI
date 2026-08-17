import { Router } from 'express';
import { SnapshotController } from '../controllers/snapshot.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/projectAuth';
import { validateRequest } from '../middleware/validate';
import { createSnapshotSchema } from '../validations/snapshot.validation';

const router = Router();

// Project snapshot routes
router.post(
  '/projects/:id/snapshots',
  requireAuth,
  requireProjectAccess('editor'),
  validateRequest(createSnapshotSchema),
  SnapshotController.create
);

router.get(
  '/projects/:id/snapshots',
  requireAuth,
  requireProjectAccess('viewer'),
  SnapshotController.list
);

// Individual snapshot routes
router.get('/snapshots/:id', requireAuth, SnapshotController.getById);
router.post('/snapshots/:id/restore', requireAuth, SnapshotController.restore);
router.delete('/snapshots/:id', requireAuth, SnapshotController.delete);

export default router;
