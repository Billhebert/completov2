/**
 * Jobs - Update Application Route
 * PATCH /api/v1/jobs/applications/:id
 * Update application status (admin only)
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupJobsUpdateApplicationRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/applications/:id`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { status, internalNotes, feedback, rating } = req.body;

      if (!['DEV', 'admin', 'admin_empresa'].includes(user.role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      const application = await prisma.jobApplication.update({
        where: { id },
        data: {
          status,
          internalNotes,
          feedback,
          rating,
          reviewedAt: new Date(),
        },
      });

      logger.info({ userId: user.id, applicationId: id }, 'Job application updated');
      res.json(application);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error updating job application');
      res.status(500).json({ error: 'Failed to update application' });
    }
  });
}
