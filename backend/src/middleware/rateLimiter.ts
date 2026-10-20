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

export const executionRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 15,
  keyGenerator: req => req.user!.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many runs. Please wait a minute before trying again.', error: { code: 'RATE_LIMIT_EXCEEDED' } },
  skip: () => env.NODE_ENV === 'test',
});

export const aiRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: req => req.user!.userId,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'AI request limit reached. Please wait a minute.', error: { code: 'AI_RATE_LIMITED' } },
  skip: () => env.NODE_ENV === 'test',
});
