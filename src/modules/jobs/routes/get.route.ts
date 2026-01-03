/**
 * Jobs - Get Route
 * GET /api/v1/jobs/:id
 * Get specific job by ID
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const job = await prisma.job.findFirst({
        where: { id, companyId: user.companyId },
        include: {
          _count: { select: { applications: true, interests: true } },
        },
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      logger.info({ userId: user.id, jobId: id }, 'Job retrieved');
      res.json(job);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error getting job');
      res.status(500).json({ error: 'Failed to get job' });
    }
  });
}
