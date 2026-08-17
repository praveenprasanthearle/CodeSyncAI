import { Request, Response, NextFunction } from 'express';
import { ChatService } from '../services/chat.service';
import { sendSuccess, sendError } from '../utils/response';
import { SocketManager } from '../sockets';

export class ChatController {
  /**
   * GET /api/v1/projects/:id/messages
   */
  static async getMessages(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.id || req.params.projectId;
      const { limit, before } = req.query;

      const result = await ChatService.getProjectMessages(
        projectId,
        limit ? Number(limit) : 50,
        before as string | undefined
      );

      sendSuccess(res, result, 'Messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/projects/:id/messages
   */
  static async sendMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.id || req.params.projectId;
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const message = await ChatService.sendMessage(projectId, userId, req.body);

      // Broadcast new message over Socket.IO room if available
      try {
        const socketManager = SocketManager.getInstance();
        socketManager.io.to(`project:${projectId}`).emit('chat:new_message', { message });
      } catch (_err) {
        // Socket broadcast optional if SocketManager not ready
      }

      sendSuccess(res, { message }, 'Message sent successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/v1/messages/:id
   */
  static async deleteMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const result = await ChatService.deleteMessage(req.params.id, userId);
      sendSuccess(res, result, 'Message deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
