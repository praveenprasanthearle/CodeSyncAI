import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs for auth routes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      details: null,
    },
    timestamp: new Date().toISOString(),
  },
  skip: () => env.NODE_ENV === 'test',
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      details: null,
    },
    timestamp: new Date().toISOString(),
  },
  skip: () => env.NODE_ENV === 'test',
});
