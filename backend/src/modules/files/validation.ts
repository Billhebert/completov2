// src/modules/files/validation.ts
import { z } from 'zod';

export const uploadFileSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
});

export const listFilesSchema = z.object({
  entityType: z.string().optional(),
  entityId: z.string().uuid().optional(),
  limit: z.string().transform(Number).optional(),
  offset: z.string().transform(Number).optional(),
});
