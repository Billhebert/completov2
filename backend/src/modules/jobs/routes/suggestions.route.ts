/**
 * Jobs - Get Suggestions Route
 * GET /api/v1/jobs/:id/suggestions
 * Get learning suggestions (Zettels) for job
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsSuggestionsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/:id/suggestions`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id: jobId } = req.params;
      const user = (req as any).user;

      const job = await prisma.job.findFirst({
        where: { id: jobId, companyId: user.companyId },
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      let suggestions = await prisma.jobZettelSuggestion.findUnique({
        where: { jobId_userId: { jobId, userId: user.id } },
      });

      if (!suggestions) {
        const requiredSkills = (job.requiredSkills as any[]) || [];
        const desiredSkills = (job.desiredSkills as any[]) || [];

        suggestions = await prisma.jobZettelSuggestion.create({
          data: {
            jobId,
            userId: user.id,
            suggestedZettels: [],
            skillGaps: [...requiredSkills, ...desiredSkills],
            estimatedTime: 0,
            priority: 'medium',
            status: 'active',
            completionRate: 0,
          },
        });
      }

      logger.info({ userId: user.id, jobId }, 'Job suggestions retrieved');
      res.json(suggestions);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error getting job suggestions');
      res.status(500).json({ error: 'Failed to get suggestions' });
    }
  });
}
