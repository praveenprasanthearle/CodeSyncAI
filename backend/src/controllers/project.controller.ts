import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service';
import { sendSuccess, sendError } from '../utils/response';

export class ProjectController {
  /**
   * POST /api/v1/projects
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const project = await ProjectService.createProject(userId, req.body);
      sendSuccess(res, { project }, 'Project created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/projects
   */
  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const result = await ProjectService.getUserProjects(userId, req.query);
      sendSuccess(res, result, 'Projects retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/projects/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const project = await ProjectService.getProjectById(req.params.id, req.user?.userId);
      sendSuccess(res, { project }, 'Project retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/projects/:id
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.project) {
        sendError(res, 'Project context missing', 500, 'INTERNAL_SERVER_ERROR');
        return;
      }

      const project = await ProjectService.updateProject(req.project, req.body);
      sendSuccess(res, { project }, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/projects/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.project) {
        sendError(res, 'Project context missing', 500, 'INTERNAL_SERVER_ERROR');
        return;
      }

      await ProjectService.deleteProject(req.project);
      sendSuccess(res, null, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/projects/:id/members
   */
  static async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.project) {
        sendError(res, 'Project context missing', 500, 'INTERNAL_SERVER_ERROR');
        return;
      }

      const { emailOrUsername, role } = req.body;
      const project = await ProjectService.addMember(req.project, emailOrUsername, role);
      sendSuccess(res, { project }, 'Collaborator invited successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/projects/:id/members/:userId
   */
  static async removeMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.project) {
        sendError(res, 'Project context missing', 500, 'INTERNAL_SERVER_ERROR');
        return;
      }

      const project = await ProjectService.removeMember(req.project, req.params.userId);
      sendSuccess(res, { project }, 'Collaborator removed successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/projects/:id/members/:userId
   */
  static async updateMemberRole(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.project) {
        sendError(res, 'Project context missing', 500, 'INTERNAL_SERVER_ERROR');
        return;
      }

      const { role } = req.body;
      const project = await ProjectService.updateMemberRole(req.project, req.params.userId, role);
      sendSuccess(res, { project }, 'Collaborator role updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/projects/:id/clone
   */
  static async clone(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.project) {
        sendError(res, 'Project context missing', 500, 'INTERNAL_SERVER_ERROR');
        return;
      }

      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const project = await ProjectService.cloneProject(req.project, userId);
      sendSuccess(res, { project }, 'Project duplicated successfully', 201);
    } catch (error) {
      next(error);
    }
  }
}
