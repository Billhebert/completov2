import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getAuditService } from '../../../core/audit';

export function setupAuditActivityRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const audit = getAuditService(prisma);

  app.get(`${baseUrl}/activity/:userId`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate, limit } = req.query;

      const activity = await audit.getUserActivity(
        req.companyId!,
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        limit ? parseInt(limit as string) : 100
      );

      res.json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  });
}
