import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { AnalyticsService } from '../service';

export function setupAnalyticsPipelineRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const analyticsService = new AnalyticsService(prisma);

  app.get(`${baseUrl}/pipeline`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const metrics = await analyticsService.getPipelineMetrics(req.companyId!);
      res.json({ success: true, data: metrics });
    } catch (error) {
      next(error);
    }
  });
}
