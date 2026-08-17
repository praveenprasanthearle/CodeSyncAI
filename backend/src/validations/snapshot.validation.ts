import { z } from 'zod';

export const createSnapshotSchema = z.object({
  name: z.string().min(1, 'Snapshot name is required').max(100, 'Snapshot name cannot exceed 100 characters'),
  description: z.string().max(500, 'Description cannot exceed 500 characters').optional().default(''),
});

export type CreateSnapshotInput = z.infer<typeof createSnapshotSchema>;
