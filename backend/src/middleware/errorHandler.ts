import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  code: string;
  details?: any;

  constructor(message: string, statusCode = 500, code = 'APP_ERROR', details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Handle Zod Validation Errors
  if (err instanceof ZodError) {
    sendError(res, 'Validation error', 400, 'VALIDATION_ERROR', err.errors);
    return;
  }

  // Handle Custom App Errors
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode, err.code, err.details);
    return;
  }

  // Handle Mongoose Cast/Duplicate Errors
  if (err.name === 'CastError') {
    sendError(res, 'Resource not found or invalid identifier format', 400, 'INVALID_ID');
    return;
  }

  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue || {})[0] || 'field';
    sendError(res, `Duplicate value entered for ${field}`, 409, 'DUPLICATE_KEY');
    return;
  }

  // Unhandled / Internal Errors
  console.error('Unhandled Error:', err);
  sendError(
    res,
    process.env.NODE_ENV === 'production'
      ? 'An unexpected error occurred. Please try again later.'
      : err.message,
    500,
    'INTERNAL_SERVER_ERROR'
  );
};
