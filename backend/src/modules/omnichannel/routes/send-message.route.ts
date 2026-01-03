import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../core/event-bus';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { EvolutionAPIService } from '../evolution.service';
import { z } from 'zod';

const sendMessageSchema = z.object({
  to: z.string(),
  text: z.string(),
});

export function setupOmnichannelSendMessageRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  app.post(`${baseUrl}/whatsapp/accounts/:accountId/send`, authenticate, tenantIsolation, validateBody(sendMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evolutionService = new EvolutionAPIService(prisma, eventBus);
      const result = await evolutionService.sendMessage(
        req.params.accountId,
        req.body.to,
        req.body.text
      );
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });
}
