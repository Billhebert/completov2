import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { EventBus } from '../../../core/event-bus';

export function setupNotificationsSummaryRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  app.get(`${baseUrl}/summary`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const unreadNotifications = await prisma.notification.findMany({
        where: { companyId: req.companyId!, userId: req.user!.id, readAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      if (unreadNotifications.length === 0) {
        return res.json({ success: true, data: { summary: 'Sem notificações não lidas', totalUnread: 0, highPriority: 0, categories: {} } });
      }

      const categories: Record<string, number> = {};
      let highPriority = 0;

      unreadNotifications.forEach(n => {
        categories[n.type] = (categories[n.type] || 0) + 1;
        const priority = (n.metadata as any)?.aiPriority || 0.5;
        if (priority >= 0.8) highPriority++;
      });

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const highPriorityNotifications = unreadNotifications.filter(n => ((n.metadata as any)?.aiPriority || 0) >= 0.8).slice(0, 10);

      let aiSummary = '';
      if (highPriorityNotifications.length > 0) {
        const notificationList = highPriorityNotifications.map((n, i) => `${i + 1}. [${n.type}] ${n.title}: ${n.body}`).join('\n');
        const context = `You have ${highPriorityNotifications.length} high-priority notifications:\n${notificationList}\n\nCreate a brief, actionable summary in Portuguese (pt-BR) of what needs attention.`;
        aiSummary = await aiService.summarize(context, 200);
      }

      res.json({
        success: true,
        data: {
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
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
