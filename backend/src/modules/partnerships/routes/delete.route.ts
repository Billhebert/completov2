/**
 * Partnerships - Delete Route
 * DELETE /api/v1/partnerships/:id
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupPartnershipsDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const existing = await prisma.partnership.findFirst({
        where: {
          id,
          OR: [{ companyAId: user.companyId }, { companyBId: user.companyId }],
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Partnership not found' });
      }

      await prisma.partnership.delete({ where: { id } });

      logger.info({ userId: user.id, partnershipId: id }, 'Partnership deleted');
      res.status(204).send();
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error deleting partnership');
      res.status(500).json({ error: 'Failed to delete partnership' });
    }
  });
}
