import { z } from 'zod';

export const nodeSchema = z.object({
  title: z.string(),
  content: z.string(),
  nodeType: z.enum(['zettel', 'documentation', 'procedure', 'reference', 'insight', 'deal', 'message', 'conversation', 'meeting', 'task']),
  tags: z.array(z.string()).optional(),
  importanceScore: z.number().min(0).max(1).optional(),
  ownerId: z.string().optional(), // For personal zettels
  isCompanyWide: z.boolean().optional(), // true = company zettel, false = personal zettel
});

export const linkSchema = z.object({
  targetId: z.string(),
  linkType: z.enum(['related', 'derives', 'supports', 'contradicts']),
  strength: z.number().min(0).max(1).optional(),
});
