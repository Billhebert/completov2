/**
 * Jobs - Create Route
 * POST /api/v1/jobs
 * Create new job (admin only)
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const data = req.body;

      const job = await prisma.job.create({
        data: {
          ...data,
          companyId: user.companyId,
          createdBy: user.id,
          publishedAt: data.status === 'open' ? new Date() : null,
        },
        include: {
          _count: { select: { applications: true, interests: true } },
        },
      });

      logger.info({ userId: user.id, jobId: job.id }, 'Job created');
      res.status(201).json(job);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error creating job');
      res.status(500).json({ error: 'Failed to create job' });
    }
  });
}
