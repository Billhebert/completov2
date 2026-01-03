import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { AnalyticsService } from '../service';

export function setupAnalyticsTimeseriesRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const analyticsService = new AnalyticsService(prisma);

  app.get(`${baseUrl}/timeseries`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { metric, startDate, endDate } = req.query;
      const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const end = endDate ? new Date(endDate as string) : new Date();

      const data = await analyticsService.getTimeSeriesData(req.companyId!, metric as string, start, end);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  });
}
