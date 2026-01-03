import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { EventBus } from '../../../core/event-bus';

class NotificationsService {
  constructor(private prisma: PrismaClient, private eventBus: EventBus) {}

  async listNotifications(userId: string, companyId: string, limit = 50, sortByPriority = false) {
    const notifications = await this.prisma.notification.findMany({
      where: { companyId, userId },
      orderBy: sortByPriority
        ? [{ metadata: { path: ['aiPriority'], sort: 'desc' } }, { createdAt: 'desc' }]
        : { createdAt: 'desc' },
      take: limit,
    });
    return notifications;
  }
}

export function setupNotificationsListRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  const service = new NotificationsService(prisma, eventBus);

  app.get(baseUrl, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sortByPriority = req.query.sortByPriority === 'true';
      const notifications = await service.listNotifications(req.user!.id, req.companyId!, 50, sortByPriority);
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  });
}
