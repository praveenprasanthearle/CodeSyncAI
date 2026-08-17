import { Router } from 'express';
import healthRoutes from './health.routes';
import authRoutes from './auth.routes';
import projectRoutes from './project.routes';
import fileRoutes from './file.routes';
import chatRoutes from './chat.routes';
import executionRoutes from './execution.routes';
import aiRoutes from './ai.routes';
import snapshotRoutes from './snapshot.routes';

const router = Router();

// Mount sub-routes
router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/projects', projectRoutes);
router.use('/', fileRoutes);
router.use('/', chatRoutes);
router.use('/', executionRoutes);
router.use('/', aiRoutes);
router.use('/', snapshotRoutes);

export default router;
