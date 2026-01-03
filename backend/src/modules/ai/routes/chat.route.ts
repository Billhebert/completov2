import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupAiChatRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/chat`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { message, systemMessage, temperature } = req.body;
      if (!message) {
        return res.status(400).json({ success: false, error: { message: 'Message is required' } });
      }
      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);
      const result = await aiService.complete({
        prompt: message,
        systemMessage: systemMessage || 'You are a helpful AI assistant.',
        temperature: temperature || 0.7,
      });
      res.json({ success: true, data: { message: result.content, model: result.model, provider: result.provider, tokensUsed: result.tokensUsed, cost: result.cost } });
    } catch (error) {
      next(error);
    }
  });
}
