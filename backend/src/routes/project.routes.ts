import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { requireAuth } from '../middleware/auth';
import { requireProjectAccess } from '../middleware/projectAuth';
import { validateRequest } from '../middleware/validate';
import {
  createProjectSchema,
  updateProjectSchema,
  addMemberSchema,
  updateMemberRoleSchema,
} from '../validations/project.validation';

const router = Router();

// Project collection routes
router.post(
  '/',
  requireAuth,
  validateRequest(createProjectSchema),
  ProjectController.create
);

router.get(
  '/',
  requireAuth,
  ProjectController.list
);

// Specific project routes
router.get(
  '/:id',
  requireProjectAccess('viewer'),
  ProjectController.getById
);

router.put(
  '/:id',
  requireAuth,
  requireProjectAccess('editor'),
  validateRequest(updateProjectSchema),
  ProjectController.update
);

router.delete(
  '/:id',
  requireAuth,
  requireProjectAccess('owner'),
  ProjectController.delete
);

// Collaborator membership routes
router.post(
  '/:id/members',
  requireAuth,
  requireProjectAccess('editor'),
  validateRequest(addMemberSchema),
  ProjectController.addMember
);

router.delete(
  '/:id/members/:userId',
  requireAuth,
  requireProjectAccess('editor'),
  ProjectController.removeMember
);

router.patch(
  '/:id/members/:userId',
  requireAuth,
  requireProjectAccess('owner'),
  validateRequest(updateMemberRoleSchema),
  ProjectController.updateMemberRole
);

// Project cloning
router.post(
  '/:id/clone',
  requireAuth,
  requireProjectAccess('viewer'),
  ProjectController.clone
);

export default router;
