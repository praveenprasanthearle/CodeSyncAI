import { Request, Response, NextFunction } from 'express';
import { FileService } from '../services/file.service';
import { sendSuccess, sendError } from '../utils/response';

export class FileController {
  /**
   * GET /api/v1/projects/:id/files
   */
  static async getTree(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.id || req.params.projectId;
      const files = await FileService.getProjectFileTree(projectId);
      sendSuccess(res, { files }, 'File tree retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/projects/:id/files/flat
   */
  static async getFlat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.id || req.params.projectId;
      const files = await FileService.getProjectFilesFlat(projectId);
      sendSuccess(res, { files }, 'Flat file list retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/projects/:id/files
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.id || req.params.projectId;
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const file = await FileService.createNode(projectId, userId, req.body);
      sendSuccess(res, { file }, 'Item created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/files/:id
   */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const file = await FileService.getFileById(req.params.id);
      sendSuccess(res, { file }, 'File retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PUT /api/v1/files/:id
   */
  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const fileId = req.params.id;
      let updatedFile;

      if (req.body.content !== undefined) {
        updatedFile = await FileService.updateFileContent(fileId, userId, req.body.content);
      } else if (req.body.name !== undefined || req.body.parentId !== undefined) {
        updatedFile = await FileService.renameOrMoveNode(fileId, userId, req.body);
      } else {
        sendError(res, 'No update parameters provided', 400, 'BAD_REQUEST');
        return;
      }

      sendSuccess(res, { file: updatedFile }, 'Item updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/files/:id
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const result = await FileService.deleteNode(req.params.id, userId);
      sendSuccess(res, result, 'Item deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
