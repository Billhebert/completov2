import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../core/event-bus';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { EvolutionAPIService } from '../evolution.service';

export function setupOmnichannelAccountDisconnectRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  app.post(`${baseUrl}/whatsapp/accounts/:accountId/disconnect`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evolutionService = new EvolutionAPIService(prisma, eventBus);
      await evolutionService.disconnectInstance(req.params.accountId);
      res.json({ success: true, message: 'Instance disconnected' });
    } catch (error) {
      next(error);
    }
  });
}
