import { z } from 'zod';

export const learningPathSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  category: z.string(),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimatedHours: z.number().positive(),
  targetSkills: z.array(z.string()).optional(),
});
