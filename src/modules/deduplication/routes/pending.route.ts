import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupDeduplicationPendingRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/pending`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const pending = await prisma.duplicateDetection.findMany({
        where: {
          companyId: req.companyId!,
          status: 'pending',
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: pending });
    } catch (error) {
      next(error);
    }
  });
}
