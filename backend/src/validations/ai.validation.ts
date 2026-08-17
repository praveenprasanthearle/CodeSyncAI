import { z } from 'zod';

export const aiChatSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(4000, 'Message cannot exceed 4000 characters'),
  projectId: z.string().optional(),
  activeFile: z
    .object({
      name: z.string(),
      path: z.string(),
      language: z.string(),
      content: z.string(),
    })
    .optional(),
  selectedCode: z.string().optional(),
  apiKey: z.string().optional(),
});

export const aiExplainSchema = z.object({
  code: z.string().min(1, 'Code snippet cannot be empty').max(50000, 'Code snippet cannot exceed 50,000 characters'),
  language: z.string().optional().default('javascript'),
  apiKey: z.string().optional(),
});

export const aiRefactorSchema = z.object({
  code: z.string().min(1, 'Code snippet cannot be empty').max(50000, 'Code snippet cannot exceed 50,000 characters'),
  language: z.string().optional().default('javascript'),
  instruction: z.string().optional().default('Improve readability, optimize performance, and follow best practices'),
  apiKey: z.string().optional(),
});

export const aiFixErrorSchema = z.object({
  code: z.string().min(1, 'Code snippet cannot be empty').max(50000, 'Code snippet cannot exceed 50,000 characters'),
  errorMessage: z.string().min(1, 'Error message cannot be empty'),
  language: z.string().optional().default('javascript'),
  apiKey: z.string().optional(),
});

export const aiGenerateTestsSchema = z.object({
  code: z.string().min(1, 'Code snippet cannot be empty').max(50000, 'Code snippet cannot exceed 50,000 characters'),
  language: z.string().optional().default('javascript'),
  framework: z.string().optional().default('vitest'),
  apiKey: z.string().optional(),
});

export type AiChatInput = z.infer<typeof aiChatSchema>;
export type AiExplainInput = z.infer<typeof aiExplainSchema>;
export type AiRefactorInput = z.infer<typeof aiRefactorSchema>;
export type AiFixErrorInput = z.infer<typeof aiFixErrorSchema>;
export type AiGenerateTestsInput = z.infer<typeof aiGenerateTestsSchema>;
