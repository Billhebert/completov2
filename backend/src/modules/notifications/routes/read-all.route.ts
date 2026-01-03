import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { EventBus } from '../../../core/event-bus';

export function setupNotificationsReadAllRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  app.post(`${baseUrl}/read-all`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      await prisma.notification.updateMany({
        where: { userId: req.user!.id, companyId: req.companyId!, readAt: null },
        data: { readAt: new Date() },
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}
