import { z } from 'zod';

export const createFileNodeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[^\\/:\*\?"<>\|]+$/, 'Name contains invalid file path characters')
    .trim(),
  type: z.enum(['file', 'folder']),
  parentId: z.string().nullable().optional(),
  content: z.string().optional().default(''),
  language: z.string().optional(),
});

export const updateContentSchema = z.object({
  content: z.string(),
});

export const renameNodeSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[^\\/:\*\?"<>\|]+$/, 'Name contains invalid file path characters')
    .trim()
    .optional(),
  parentId: z.string().nullable().optional(),
});

export type CreateFileNodeInput = z.infer<typeof createFileNodeSchema>;
export type UpdateContentInput = z.infer<typeof updateContentSchema>;
export type RenameNodeInput = z.infer<typeof renameNodeSchema>;
