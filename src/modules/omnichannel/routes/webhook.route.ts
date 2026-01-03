import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../core/event-bus';
import { EvolutionAPIService } from '../evolution.service';

export function setupOmnichannelWebhookRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  app.post(`${baseUrl}/webhooks/whatsapp`, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evolutionService = new EvolutionAPIService(prisma, eventBus);
      await evolutionService.handleWebhook(req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });
}
