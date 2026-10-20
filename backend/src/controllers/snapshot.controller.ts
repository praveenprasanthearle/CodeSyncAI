import { Request, Response, NextFunction } from 'express';
import { SnapshotService } from '../services/snapshot.service';
import { sendSuccess } from '../utils/response';

export class SnapshotController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const snapshot = await SnapshotService.createSnapshot(
        req.params.id,
        req.user!.userId,
        req.body.name,
        req.body.description
      );
      sendSuccess(res, { snapshot }, 'Snapshot created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const snapshots = await SnapshotService.listSnapshots(req.params.id);
      sendSuccess(res, { snapshots }, 'Snapshots retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const snapshot = await SnapshotService.getSnapshotById(req.params.id, req.user!.userId);
      sendSuccess(res, { snapshot }, 'Snapshot retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  static async restore(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SnapshotService.restoreSnapshot(req.params.id, req.user!.userId);
      sendSuccess(res, result, 'Workspace restored to snapshot successfully');
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await SnapshotService.deleteSnapshot(req.params.id, req.user!.userId);
      sendSuccess(res, null, 'Snapshot deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
