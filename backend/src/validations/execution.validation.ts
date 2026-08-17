import { z } from 'zod';

export const executeCodeSchema = z.object({
  language: z.enum(['c', 'cpp', 'javascript', 'typescript', 'python', 'go', 'rust', 'java'], {
    errorMap: () => ({ message: 'Language must be one of: c, cpp, javascript, typescript, python, go, rust, java' }),
  }),
  code: z.string().min(1, 'Code payload cannot be empty').max(100000, 'Code payload cannot exceed 100,000 characters'),
  entryFile: z.string().optional(),
  stdin: z.string().max(50000, 'Stdin input cannot exceed 50,000 characters').optional().default(''),
  timeoutMs: z.number().int().min(500).max(10000).optional().default(5000),
});

export type ExecuteCodeInput = z.infer<typeof executeCodeSchema>;
