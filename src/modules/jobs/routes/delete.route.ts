/**
 * Jobs - Delete Route
 * DELETE /api/v1/jobs/:id
 * Delete job (admin only)
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response) => {
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

      await prisma.job.delete({ where: { id } });

      logger.info({ userId: user.id, jobId: id }, 'Job deleted');
      res.status(204).send();
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error deleting job');
      res.status(500).json({ error: 'Failed to delete job' });
    }
  });
}
