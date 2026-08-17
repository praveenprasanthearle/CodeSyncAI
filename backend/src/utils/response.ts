import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    details?: any;
  };
  timestamp: string;
}

export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    ...(message && { message }),
    ...(data !== undefined && { data }),
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    error: {
      code,
      ...(details && { details }),
    },
    timestamp: new Date().toISOString(),
  };
  return res.status(statusCode).json(response);
};
