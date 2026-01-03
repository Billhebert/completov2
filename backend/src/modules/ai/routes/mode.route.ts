import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupAiModeRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/mode`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);
      res.json({ success: true, data: { mode: aiService.getMode() } });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${baseUrl}/mode`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { mode } = req.body;
      if (!['full', 'auto', 'economico'].includes(mode)) {
        return res.status(400).json({ success: false, error: { message: 'Invalid mode. Must be: full, auto, or economico' } });
      }
      const { getAIService } = await import('../../../core/ai/ai.service');
      const aiService = getAIService(prisma);
      aiService.setMode(mode);
      res.json({ success: true, data: { mode } });
    } catch (error) {
      next(error);
    }
  });
}
