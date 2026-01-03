import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupChatChannelSentimentRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/channels/:channelId/sentiment`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await prisma.message.findMany({
        where: {
          channelId: req.params.channelId,
          companyId: req.companyId!,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: { author: { select: { id: true, name: true } } },
      });

      if (messages.length === 0) {
        return res.json({
          success: true,
          data: {
            overallSentiment: 'neutral',
            averageScore: 0.5,
            messageCount: 0,
          },
        });
      }

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const recentMessages = messages.slice(0, 10);
      const sentiments = await Promise.all(
        recentMessages.map(m => aiService.analyzeSentiment(m.content).catch(() => ({ sentiment: 'neutral', score: 0.5 })))
      );

      const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
      const positiveCount = sentiments.filter(s => s.sentiment === 'positive').length;
      const negativeCount = sentiments.filter(s => s.sentiment === 'negative').length;

      const overallSentiment =
        positiveCount > negativeCount * 2 ? 'positive' :
        negativeCount > positiveCount * 2 ? 'negative' : 'neutral';

      res.json({
        success: true,
        data: {
          overallSentiment,
          averageScore: avgScore,
          messageCount: messages.length,
          distribution: {
            positive: positiveCount,
            neutral: sentiments.length - positiveCount - negativeCount,
            negative: negativeCount,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
