// src/modules/crm/schemas/interaction.schema.ts
import { z } from 'zod';

/**
 * Schema for creating an interaction
 */
export const createInteractionSchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'note'], {
    errorMap: () => ({ message: 'Type must be one of: call, email, meeting, note' }),
  }),
  contactId: z.string().uuid('Invalid contact ID').optional(),
  dealId: z.string().uuid('Invalid deal ID').optional(),
  subject: z.string().max(200, 'Subject too long').optional(),
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long'),
  direction: z.enum(['inbound', 'outbound']).optional(),
  scheduledFor: z.string().datetime().optional(),
});

/**
 * Schema for listing interactions with filters
 */
export const listInteractionSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID').optional(),
  dealId: z.string().uuid('Invalid deal ID').optional(),
  type: z.enum(['call', 'email', 'meeting', 'note']).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).default('50'),
  offset: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(0)).optional(),
});
