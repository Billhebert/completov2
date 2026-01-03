import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupChatSentimentRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/messages/:id/sentiment`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await prisma.message.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: { author: { select: { name: true } } },
      });

      if (!message) {
        return res.status(404).json({ success: false, error: { message: 'Message not found' } });
      }

      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);

      const sentiment = await aiService.analyzeSentiment(message.content);

      res.json({
        success: true,
        data: {
          sentiment: sentiment.sentiment,
          score: sentiment.score,
          message: message.content,
          author: message.author.name,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
