// src/modules/webhooks/validation.ts
import { z } from 'zod';

export const createSubscriptionSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()).min(1),
  description: z.string().optional(),
});

export const updateSubscriptionSchema = z.object({
  url: z.string().url().optional(),
  events: z.array(z.string()).min(1).optional(),
  description: z.string().optional(),
  active: z.boolean().optional(),
});
