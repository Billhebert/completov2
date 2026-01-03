/**
 * Jobs - Apply Route
 * POST /api/v1/jobs/:id/apply
 * Apply to a job
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsApplyRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/:id/apply`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id: jobId } = req.params;
      const user = (req as any).user;
      const { coverLetter, resume, documents } = req.body;

      const job = await prisma.job.findFirst({
        where: { id: jobId, companyId: user.companyId, status: 'open', isActive: true },
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found or not open for applications' });
      }

      const existing = await prisma.jobApplication.findUnique({
        where: { jobId_userId: { jobId, userId: user.id } },
      });

      if (existing) {
        return res.status(400).json({ error: 'Already applied to this job' });
      }

      const application = await prisma.jobApplication.create({
        data: {
          jobId,
          userId: user.id,
          coverLetter,
          resume,
          documents,
          status: 'pending',
        },
      });

      logger.info({ userId: user.id, jobId, applicationId: application.id }, 'Job application created');
      res.status(201).json(application);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error creating job application');
      res.status(500).json({ error: 'Failed to apply to job' });
    }
  });
}
