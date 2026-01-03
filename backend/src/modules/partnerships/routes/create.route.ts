/**
 * Partnerships - Create Route
 * POST /api/v1/partnerships
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupPartnershipsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { companyBId, shareJobs, shareServices, shareKnowledge, metadata } = req.body;

      const partnership = await prisma.partnership.create({
        data: {
          companyAId: user.companyId,
          companyBId,
          status: 'pending',
          shareJobs: shareJobs ?? false,
          shareServices: shareServices ?? false,
          shareKnowledge: shareKnowledge ?? false,
          metadata: metadata ?? {},
        },
        include: {
          companyA: { select: { id: true, name: true, domain: true } },
          companyB: { select: { id: true, name: true, domain: true } },
        },
      });

      logger.info({ userId: user.id, partnershipId: partnership.id }, 'Partnership created');
      res.status(201).json(partnership);
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error creating partnership');
      res.status(500).json({ error: 'Failed to create partnership' });
    }
  });
}
