import { Request, Response, NextFunction } from 'express';
import { ExecutionService } from '../services/execution.service';
import { sendSuccess } from '../utils/response';

export class ExecutionController {
  /**
   * POST /api/v1/execution/run
   */
  static async runCode(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await ExecutionService.executeCode(req.body);
      sendSuccess(res, { result }, 'Code execution completed');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/execution/languages
   */
  static async getLanguages(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const languages = ExecutionService.getSupportedLanguages();
      sendSuccess(res, { languages }, 'Supported execution languages retrieved');
    } catch (error) {
      next(error);
    }
  }
}
