/**
 * Partnerships - Update Route
 * PUT /api/v1/partnerships/:id
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupPartnershipsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.put(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const user = (req as any).user;
      const { status, shareJobs, shareServices, shareKnowledge, metadata } = req.body;

      const existing = await prisma.partnership.findFirst({
        where: {
          id,
          OR: [{ companyAId: user.companyId }, { companyBId: user.companyId }],
        },
      });

      if (!existing) {
        return res.status(404).json({ error: 'Partnership not found' });
      }

      const partnership = await prisma.partnership.update({
        where: { id },
        data: { status, shareJobs, shareServices, shareKnowledge, metadata },
        include: {
          companyA: { select: { id: true, name: true, domain: true } },
          companyB: { select: { id: true, name: true, domain: true } },
        },
      });

      logger.info({ userId: user.id, partnershipId: id }, 'Partnership updated');
      res.json(partnership);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error updating partnership');
      res.status(500).json({ error: 'Failed to update partnership' });
    }
  });
}
