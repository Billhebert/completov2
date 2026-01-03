/**
 * Partnerships - Get Route
 * GET /api/v1/partnerships/:id
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupPartnershipsGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;

      const partnership = await prisma.partnership.findFirst({
        where: {
          id,
          OR: [{ companyAId: user.companyId }, { companyBId: user.companyId }],
        },
        include: {
          companyA: { select: { id: true, name: true, domain: true } },
          companyB: { select: { id: true, name: true, domain: true } },
        },
      });

      if (!partnership) {
        return res.status(404).json({ error: 'Partnership not found' });
      }

      logger.info({ userId: user.id, partnershipId: id }, 'Partnership retrieved');
      res.json(partnership);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error getting partnership');
      res.status(500).json({ error: 'Failed to get partnership' });
    }
  });
}
