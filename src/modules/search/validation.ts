// src/modules/search/validation.ts
import { z } from 'zod';

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['contacts', 'deals', 'messages', 'knowledge', 'users', 'products', 'all']).optional(),
  limit: z.string().transform((val) => {
    const num = Number(val);
    return num >= 1 && num <= 100 ? num : 20;
  }).optional(),
});

export const suggestSchema = z.object({
  q: z.string().min(2).max(100),
  type: z.string().optional(),
  limit: z.string().transform((val) => {
    const num = Number(val);
    return num >= 1 && num <= 20 ? num : 10;
  }).optional(),
});
