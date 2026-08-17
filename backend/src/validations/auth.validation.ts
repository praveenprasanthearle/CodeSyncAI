import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .trim(),
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters long')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-z0-9_]+$/i, 'Username can only contain alphanumeric characters and underscores')
    .toLowerCase()
    .trim(),
  email: z
    .string()
    .email('Please provide a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password cannot exceed 100 characters')
    .regex(
      /^(?=.*[a-zA-Z])(?=.*\d).+$/,
      'Password must contain at least one letter and one number'
    ),
});

export const loginSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required').trim(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name cannot exceed 50 characters')
    .trim()
    .optional(),
  avatarUrl: z.string().url('Avatar URL must be a valid URL').optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
