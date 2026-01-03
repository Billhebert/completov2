/**
 * Jobs - Update Route
 * PUT /api/v1/jobs/:id
 * Update existing job (admin only)
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.put(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const existing = await prisma.job.findFirst({
        where: { id, companyId: user.companyId },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Job not found' });
      }

      const data = req.body;
      const job = await prisma.job.update({
        where: { id },
        data: {
          ...data,
          publishedAt: data.status === 'open' && !existing.publishedAt ? new Date() : existing.publishedAt,
          closedAt: data.status === 'closed' ? new Date() : existing.closedAt,
        },
        include: {
          _count: { select: { applications: true, interests: true } },
        },
      });

      logger.info({ userId: user.id, jobId: id }, 'Job updated');
      res.json(job);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error updating job');
      res.status(500).json({ error: 'Failed to update job' });
    }
  });
}
