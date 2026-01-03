/**
 * Jobs - Mark Interest Route
 * POST /api/v1/jobs/:id/interest
 * Mark interest in a job
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsInterestRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/:id/interest`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id: jobId } = req.params;
      const user = (req as any).user;
      const { reason, notifyOnChanges = true } = req.body;

      const job = await prisma.job.findFirst({
        where: { id: jobId, companyId: user.companyId, isActive: true },
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const interest = await prisma.jobInterest.upsert({
        where: { jobId_userId: { jobId, userId: user.id } },
        create: { jobId, userId: user.id, reason, notifyOnChanges },
        update: { reason, notifyOnChanges },
      });

      logger.info({ userId: user.id, jobId, interestId: interest.id }, 'Job interest marked');
      res.status(201).json(interest);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error marking job interest');
      res.status(500).json({ error: 'Failed to mark interest' });
    }
  });
}
