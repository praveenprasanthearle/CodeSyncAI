import { z } from 'zod';

export const sendMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters').trim(),
  fileReference: z
    .object({
      fileId: z.string().optional(),
      path: z.string().min(1),
      line: z.number().int().positive().optional().default(1),
    })
    .optional(),
});

export const editMessageSchema = z.object({
  text: z.string().min(1, 'Message cannot be empty').max(2000, 'Message cannot exceed 2000 characters').trim(),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type EditMessageInput = z.infer<typeof editMessageSchema>;
