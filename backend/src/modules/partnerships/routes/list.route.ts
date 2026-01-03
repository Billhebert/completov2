/**
 * Partnerships - List Route
 * GET /api/v1/partnerships
 */

import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../../../core/logger';
import { authenticate } from '../../../core/middleware/auth';

export function setupPartnershipsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const { status, page = 1, pageSize = 20 } = req.query;
      const skip = (Number(page) - 1) * Number(pageSize);
      const take = Number(pageSize);

      const where: any = {
        OR: [{ companyAId: user.companyId }, { companyBId: user.companyId }],
      };
      if (status) where.status = status;

      const [partnerships, total] = await Promise.all([
        prisma.partnership.findMany({
          where,
          skip,
          take,
          include: {
            companyA: { select: { id: true, name: true, domain: true } },
            companyB: { select: { id: true, name: true, domain: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
        prisma.partnership.count({ where }),
      ]);

      logger.info({ userId: user.id, count: partnerships.length }, 'Partnerships listed');
      res.json({ data: partnerships, total, page: Number(page), pageSize: take, totalPages: Math.ceil(total / take) });
    } catch (error: any) {
      logger.error({ error: error.message }, 'Error listing partnerships');
      res.status(500).json({ error: 'Failed to list partnerships' });
    }
  });
}
