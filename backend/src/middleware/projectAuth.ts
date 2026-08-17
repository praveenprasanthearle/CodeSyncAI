import { Request, Response, NextFunction } from 'express';
import { Project, IProjectDocument, ProjectRole } from '../models/Project';
import { verifyAccessToken } from '../utils/token';
import { sendError } from '../utils/response';
import mongoose from 'mongoose';

declare global {
  namespace Express {
    interface Request {
      project?: IProjectDocument;
      projectRole?: ProjectRole;
    }
  }
}

export const requireProjectAccess = (minRole: ProjectRole = 'viewer') => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const projectId = req.params.id || req.params.projectId;
      if (!projectId || !mongoose.Types.ObjectId.isValid(projectId)) {
        sendError(res, 'Invalid project identifier format', 400, 'INVALID_PROJECT_ID');
        return;
      }

      const project = await Project.findById(projectId);
      if (!project) {
        sendError(res, 'Project not found', 404, 'PROJECT_NOT_FOUND');
        return;
      }

      // Check if user is already authenticated via requireAuth or parse token if present
      if (!req.user && req.headers.authorization?.startsWith('Bearer ')) {
        const token = req.headers.authorization.split(' ')[1];
        try {
          req.user = verifyAccessToken(token);
        } catch (_err) {
          // Token invalid; continue with unauthenticated check
        }
      }

      const userId = req.user?.userId;
      if (!userId) {
        // Public project check for unauthenticated read
        if (project.visibility === 'public' && minRole === 'viewer') {
          req.project = project;
          req.projectRole = 'viewer';
          return next();
        }
        sendError(res, 'Authentication required to access this project', 401, 'UNAUTHORIZED');
        return;
      }

      const hasAccess = project.hasAccess(userId, minRole);
      if (!hasAccess) {
        sendError(
          res,
          `Insufficient permissions. You need at least '${minRole}' role on this project.`,
          403,
          'FORBIDDEN'
        );
        return;
      }

      req.project = project;
      req.projectRole = project.getMemberRole(userId) || (project.visibility === 'public' ? 'viewer' : undefined);
      next();
    } catch (error) {
      next(error);
    }
  };
};
