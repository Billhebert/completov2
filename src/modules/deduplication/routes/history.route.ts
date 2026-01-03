import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupDeduplicationHistoryRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/history`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await prisma.mergeHistory.findMany({
        where: { companyId: req.companyId! },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  });
}
