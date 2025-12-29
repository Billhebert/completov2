// src/modules/notifications/index.ts
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModuleDefinition } from '../../core/types';
import { authenticate, tenantIsolation } from '../../core/middleware';
import { EventBus, Events } from '../../core/event-bus';

class NotificationsService {
  constructor(private prisma: PrismaClient, private eventBus: EventBus) {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Listen to various events and create notifications
    this.eventBus.on(Events.CHAT_MESSAGE_SENT, async (event: any) => {
      if (event.data.recipientId) {
        await this.createNotification({
          companyId: event.companyId,
          userId: event.data.recipientId,
          type: 'chat_message',
          title: 'New message',
          body: event.data.preview || 'You have a new message',
          data: { messageId: event.data.messageId },
        });
      }
    });

    this.eventBus.on(Events.DEAL_WON, async (event: any) => {
      await this.createNotification({
        companyId: event.companyId,
        userId: event.userId!,
        type: 'deal_won',
        title: 'Deal Won! 🎉',
        body: `Deal "${event.data.dealTitle}" was won!`,
        data: { dealId: event.data.dealId },
      });
    });
  }

  async createNotification(data: any) {
    try {
      const notification = await this.prisma.notification.create({ data });
      
      // Emit event for real-time delivery
      await this.eventBus.publish(Events.NOTIFICATION_CREATED, {
        type: Events.NOTIFICATION_CREATED,
        version: 'v1',
        timestamp: new Date(),
        companyId: data.companyId,
        userId: data.userId,
        data: notification,
      });

      return notification;
    } catch (error) {
      console.error('Failed to create notification:', error);
      return null;
    }
  }

  async listNotifications(userId: string, companyId: string, limit = 50) {
    return this.prisma.notification.findMany({
      where: { companyId, userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markAsRead(id: string, userId: string, companyId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId, companyId },
      data: { readAt: new Date() },
    });
  }

  async markAllAsRead(userId: string, companyId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, companyId, readAt: null },
      data: { readAt: new Date() },
    });
  }
}

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const service = new NotificationsService(prisma, eventBus);
  const base = '/api/v1/notifications';

  app.get(base, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const notifications = await service.listNotifications(
        req.user!.id,
        req.companyId!
      );
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/:id/read`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      await service.markAsRead(req.params.id, req.user!.id, req.companyId!);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/read-all`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      await service.markAllAsRead(req.user!.id, req.companyId!);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}

export const notificationsModule: ModuleDefinition = {
  name: 'notifications',
  version: '1.0.0',
  provides: ['notifications'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
