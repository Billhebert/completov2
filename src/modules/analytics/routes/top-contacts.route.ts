import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { AnalyticsService } from '../service';

export function setupAnalyticsTopContactsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const analyticsService = new AnalyticsService(prisma);

  app.get(`${baseUrl}/top-contacts`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const contacts = await analyticsService.getTopContacts(req.companyId!, limit);
      res.json({ success: true, data: contacts });
    } catch (error) {
      next(error);
    }
  });
}
