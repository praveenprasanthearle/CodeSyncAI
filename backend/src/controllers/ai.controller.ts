import { Request, Response, NextFunction } from 'express';
import { AiService } from '../services/ai.service';
import { sendSuccess } from '../utils/response';

export class AiController {
  static status(_req: Request, res: Response): void {
    sendSuccess(res, AiService.status());
  }

  static async checkConnection(req: Request, res: Response, next: NextFunction): Promise<void> {
    try { sendSuccess(res, await AiService.checkConnection(req.body), 'AI provider connection verified'); }
    catch (error) { next(error); }
  }
  static async chat(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiService.chat(req.body);
      sendSuccess(res, result, 'AI response generated');
    } catch (error) {
      next(error);
    }
  }

  static async explain(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiService.explainCode(req.body);
      sendSuccess(res, result, 'Code explanation generated');
    } catch (error) {
      next(error);
    }
  }

  static async refactor(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiService.refactorCode(req.body);
      sendSuccess(res, result, 'Code refactored successfully');
    } catch (error) {
      next(error);
    }
  }

  static async fixError(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiService.fixError(req.body);
      sendSuccess(res, result, 'Error diagnosed and fix generated');
    } catch (error) {
      next(error);
    }
  }

  static async generateTests(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AiService.generateTests(req.body);
      sendSuccess(res, result, 'Unit tests generated successfully');
    } catch (error) {
      next(error);
    }
  }
}
