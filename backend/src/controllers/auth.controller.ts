import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess, sendError } from '../utils/response';
import {
  REFRESH_COOKIE_NAME,
  setRefreshTokenCookie,
  clearRefreshTokenCookie,
} from '../utils/token';

export class AuthController {
  /**
   * POST /api/v1/auth/register
   */
  static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      setRefreshTokenCookie(res, result.refreshToken);
      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Account registered successfully',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/login
   */
  static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, username, emailOrUsername, password } = req.body;
      const identifier = emailOrUsername || email || username;

      const result = await AuthService.login({
        emailOrUsername: identifier,
        password,
      });

      setRefreshTokenCookie(res, result.refreshToken);
      sendSuccess(
        res,
        {
          user: result.user,
          accessToken: result.accessToken,
        },
        'Signed in successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/refresh
   */
  static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken =
        req.cookies?.[REFRESH_COOKIE_NAME] ||
        req.signedCookies?.[REFRESH_COOKIE_NAME] ||
        req.body?.refreshToken;

      if (!refreshToken) {
        sendError(res, 'No refresh token provided in session cookie or body.', 401, 'MISSING_REFRESH_TOKEN');
        return;
      }

      const result = await AuthService.refreshSession(refreshToken);
      setRefreshTokenCookie(res, result.refreshToken);

      sendSuccess(
        res,
        {
          accessToken: result.accessToken,
          user: result.user,
        },
        'Access token refreshed successfully'
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/v1/auth/logout
   */
  static async logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      clearRefreshTokenCookie(res);
      sendSuccess(res, null, 'Signed out successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/v1/auth/me
   */
  static async getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const user = await AuthService.getUserProfile(req.user.userId);
      sendSuccess(res, { user }, 'Current user profile retrieved');
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/v1/auth/profile
   */
  static async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        sendError(res, 'Unauthorized', 401, 'UNAUTHORIZED');
        return;
      }

      const updatedUser = await AuthService.updateProfile(req.user.userId, req.body);
      sendSuccess(res, { user: updatedUser }, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  }
}
