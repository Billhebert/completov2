/**
 * Jobs - List Applications Route
 * GET /api/v1/jobs/:id/applications
 * List all applications for a job (admin only)
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsApplicationsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/:id/applications`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id: jobId } = req.params;
      const user = (req as any).user;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const job = await prisma.job.findFirst({
        where: { id: jobId, companyId: user.companyId },
      });

      if (!job) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const applications = await prisma.jobApplication.findMany({
        where: { jobId },
        include: {
          user: {
            select: { id: true, name: true, email: true, avatar: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      logger.info({ userId: user.id, jobId, count: applications.length }, 'Job applications listed');
      res.json(applications);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error listing job applications');
      res.status(500).json({ error: 'Failed to list applications' });
    }
  });
}
