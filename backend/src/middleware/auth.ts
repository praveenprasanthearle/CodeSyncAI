import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, AccessTokenPayload } from '../utils/token';
import { sendError } from '../utils/response';
import { User } from '../models/User';

declare global {
  namespace Express {
    interface Request {
      user?: AccessTokenPayload;
    }
  }
}

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendError(res, 'Authentication required. Please provide a valid token.', 401, 'UNAUTHORIZED');
      return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      sendError(res, 'Authentication token is missing.', 401, 'UNAUTHORIZED');
      return;
    }

    let payload: AccessTokenPayload;
    try {
      payload = verifyAccessToken(token);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        sendError(res, 'Token has expired. Please refresh your session.', 401, 'TOKEN_EXPIRED');
        return;
      }
      sendError(res, 'Invalid authentication token.', 401, 'INVALID_TOKEN');
      return;
    }

    // Verify user exists in database
    const user = await User.findById(payload.userId).select('id role isVerified');
    if (!user) {
      sendError(res, 'User account associated with this token no longer exists.', 401, 'USER_NOT_FOUND');
      return;
    }

    req.user = payload;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (role: 'user' | 'admin') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required.', 401, 'UNAUTHORIZED');
      return;
    }

    if (req.user.role !== role && req.user.role !== 'admin') {
      sendError(res, 'You do not have permission to perform this action.', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
};
