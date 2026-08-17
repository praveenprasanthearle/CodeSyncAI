import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters long')
    .max(60, 'Project name cannot exceed 60 characters')
    .trim(),
  description: z
    .string()
    .max(300, 'Description cannot exceed 300 characters')
    .trim()
    .optional()
    .default(''),
  visibility: z.enum(['public', 'private']).default('private'),
  template: z.enum(['c', 'cpp', 'blank', 'react', 'nodejs', 'python', 'go']).default('c'),
  tags: z
    .array(z.string().min(1).max(20).trim().toLowerCase())
    .max(5, 'Maximum of 5 tags allowed')
    .optional()
    .default([]),
});

export const updateProjectSchema = z.object({
  name: z
    .string()
    .min(2, 'Project name must be at least 2 characters long')
    .max(60, 'Project name cannot exceed 60 characters')
    .trim()
    .optional(),
  description: z
    .string()
    .max(300, 'Description cannot exceed 300 characters')
    .trim()
    .optional(),
  visibility: z.enum(['public', 'private']).optional(),
  tags: z
    .array(z.string().min(1).max(20).trim().toLowerCase())
    .max(5, 'Maximum of 5 tags allowed')
    .optional(),
  isArchived: z.boolean().optional(),
});

export const addMemberSchema = z.object({
  emailOrUsername: z.string().min(1, 'Email or username is required').trim(),
  role: z.enum(['editor', 'viewer']).default('editor'),
});

export const updateMemberRoleSchema = z.object({
  role: z.enum(['editor', 'viewer']),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AddMemberInput = z.infer<typeof addMemberSchema>;
export type UpdateMemberRoleInput = z.infer<typeof updateMemberRoleSchema>;
