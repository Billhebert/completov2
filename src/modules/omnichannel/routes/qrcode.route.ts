import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../core/event-bus';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { EvolutionAPIService } from '../evolution.service';

export function setupOmnichannelQrcodeRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  app.get(`${baseUrl}/whatsapp/accounts/:accountId/qrcode`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evolutionService = new EvolutionAPIService(prisma, eventBus);
      const qr = await evolutionService.getQRCode(req.params.accountId);
      res.json({ success: true, data: qr });
    } catch (error) {
      next(error);
    }
  });
}
