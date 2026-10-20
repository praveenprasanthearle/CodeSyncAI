import { z } from 'zod';

const providerFields = {
  provider: z.enum(['auto', 'gemini', 'openai']).default('auto'),
  apiKey: z.preprocess(value => typeof value === 'string' ? value.trim() || undefined : value, z.string().min(8).max(512).optional()),
};
export const aiConnectionSchema = z.object(providerFields);
export const aiChatSchema = z.object({
  ...providerFields,
  message: z.string().trim().min(1, 'Message cannot be empty').max(8000),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(16000) })).max(20).default([])
    .refine(messages => messages.reduce((size, item) => size + item.content.length, 0) <= 60000, 'Conversation history is too long'),
  projectId: z.string().optional(),
  activeFile: z.object({ name: z.string().max(256), path: z.string().max(1024), language: z.string().max(64), content: z.string().max(50000) }).optional(),
  selectedCode: z.string().max(20000).optional(),
});
const codeFields = { ...providerFields, code: z.string().trim().min(1, 'Code cannot be empty').max(50000), language: z.string().max(64).default('javascript') };
export const aiExplainSchema = z.object(codeFields);
export const aiRefactorSchema = z.object({ ...codeFields, instruction: z.string().max(2000).default('Improve readability and follow best practices while preserving behavior') });
export const aiFixErrorSchema = z.object({ ...codeFields, errorMessage: z.string().trim().min(1).max(8000) });
export const aiGenerateTestsSchema = z.object({ ...codeFields, framework: z.string().max(128).optional() });
export type AiConnectionInput = z.infer<typeof aiConnectionSchema>;
export type AiChatInput = z.infer<typeof aiChatSchema>;
export type AiExplainInput = z.infer<typeof aiExplainSchema>;
export type AiRefactorInput = z.infer<typeof aiRefactorSchema>;
export type AiFixErrorInput = z.infer<typeof aiFixErrorSchema>;
export type AiGenerateTestsInput = z.infer<typeof aiGenerateTestsSchema>;
