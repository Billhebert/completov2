import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { AnalyticsService } from '../service';

export function setupAnalyticsActivityRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const analyticsService = new AnalyticsService(prisma);

  app.get(`${baseUrl}/activity`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const activity = await analyticsService.getUserActivity(req.companyId!, days);
      res.json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  });
}
