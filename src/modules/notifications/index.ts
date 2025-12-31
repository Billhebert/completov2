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
      // Use AI to analyze notification and add intelligent metadata
      const { getAIService } = await import('../../core/ai/ai.service');
      const aiService = getAIService(this.prisma);

      // Analyze sentiment and priority
      const content = `${data.title}\n${data.body}`;

      // Run AI analysis in parallel
      const [sentimentResult, priorityScore] = await Promise.all([
        aiService.analyzeSentiment(content).catch(() => ({ sentiment: 'neutral', score: 0.5 })),
        this.calculateAIPriority(aiService, data).catch(() => 0.5),
      ]);

      // Create notification with AI-enhanced metadata
      const notification = await this.prisma.notification.create({
        data: {
          ...data,
          metadata: {
            ...data.metadata,
            aiSentiment: sentimentResult.sentiment,
            aiSentimentScore: sentimentResult.score,
            aiPriority: priorityScore,
          },
        },
      });

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

  private async calculateAIPriority(aiService: any, notificationData: any): Promise<number> {
    const priorityKeywords = {
      urgent: ['urgent', 'critical', 'importante', 'urgente', 'crítico', 'asap', 'immediately'],
      high: ['high priority', 'alta prioridade', 'importante', 'won', 'ganhou', 'lost', 'perdeu'],
      low: ['fyi', 'informação', 'info', 'update', 'atualização'],
    };

    const content = `${notificationData.title} ${notificationData.body}`.toLowerCase();

    // Check for priority keywords
    if (priorityKeywords.urgent.some(k => content.includes(k))) return 1.0;
    if (priorityKeywords.high.some(k => content.includes(k))) return 0.8;
    if (priorityKeywords.low.some(k => content.includes(k))) return 0.3;

    // Use AI for complex priority analysis
    try {
      const context = `
        Notification Type: ${notificationData.type}
        Title: ${notificationData.title}
        Body: ${notificationData.body}

        On a scale of 0 to 1, how urgent/important is this notification?
        0 = very low priority (can wait days)
        0.5 = medium priority (can wait hours)
        1.0 = very high priority (needs immediate attention)
      `;

      const result = await aiService.complete({
        prompt: context,
        systemMessage: 'You are a priority assessment system. Return only a number between 0 and 1.',
        temperature: 0.3,
      });

      const score = parseFloat(result.content.match(/\d+\.?\d*/)?.[0] || '0.5');
      return Math.max(0, Math.min(1, score)); // Clamp to 0-1
    } catch {
      return 0.5; // Default medium priority
    }
  }

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

  async getIntelligentSummary(userId: string, companyId: string) {
    // Get unread notifications
    const unreadNotifications = await this.prisma.notification.findMany({
      where: { companyId, userId, readAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (unreadNotifications.length === 0) {
      return {
        summary: 'Sem notificações não lidas',
        totalUnread: 0,
        highPriority: 0,
        categories: {},
      };
    }

    // Count by type and priority
    const categories: Record<string, number> = {};
    let highPriority = 0;

    unreadNotifications.forEach(n => {
      categories[n.type] = (categories[n.type] || 0) + 1;
      const priority = (n.metadata as any)?.aiPriority || 0.5;
      if (priority >= 0.8) highPriority++;
    });

    // Generate AI summary for high-priority notifications
    const { getAIService } = await import('../../core/ai/ai.service');
    const aiService = getAIService(this.prisma);

    const highPriorityNotifications = unreadNotifications
      .filter(n => ((n.metadata as any)?.aiPriority || 0) >= 0.8)
      .slice(0, 10);

    let aiSummary = '';
    if (highPriorityNotifications.length > 0) {
      const context = `
        You have ${highPriorityNotifications.length} high-priority notifications:
        ${highPriorityNotifications.map((n, i) => `${i + 1}. [${n.type}] ${n.title}: ${n.body}`).join('\n')}

        Create a brief, actionable summary in Portuguese (pt-BR) of what needs attention.
      `;

      const summary = await aiService.summarize(context, 200);
      aiSummary = summary;
    }

    return {
      summary: aiSummary || `Você tem ${unreadNotifications.length} notificações não lidas`,
      totalUnread: unreadNotifications.length,
      highPriority,
      categories,
      topNotifications: highPriorityNotifications.slice(0, 5).map(n => ({
        id: n.id,
        type: n.type,
        title: n.title,
        priority: (n.metadata as any)?.aiPriority || 0.5,
        sentiment: (n.metadata as any)?.aiSentiment || 'neutral',
      })),
    };
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
      const sortByPriority = req.query.sortByPriority === 'true';
      const notifications = await service.listNotifications(
        req.user!.id,
        req.companyId!,
        50,
        sortByPriority
      );
      res.json({ success: true, data: notifications });
    } catch (error) {
      next(error);
    }
  });

  // AI-powered intelligent summary
  app.get(`${base}/summary`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const summary = await service.getIntelligentSummary(
        req.user!.id,
        req.companyId!
      );
      res.json({ success: true, data: summary });
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
