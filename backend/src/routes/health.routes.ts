import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sendSuccess } from '../utils/response';

const router = Router();

router.get('/', (_req: Request, res: Response) => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  const memoryUsage = process.memoryUsage();

  sendSuccess(res, {
    status: 'healthy',
    service: 'CodeSync AI Backend Gateway',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    database: {
      status: dbStatus,
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
        heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      },
    },
  }, 'System is fully operational');
});

export default router;
