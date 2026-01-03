import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../core/event-bus';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { EvolutionAPIService } from '../evolution.service';

export function setupOmnichannelAccountDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  app.delete(`${baseUrl}/whatsapp/accounts/:accountId`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evolutionService = new EvolutionAPIService(prisma, eventBus);

      // First try to disconnect the instance
      try {
        await evolutionService.disconnectInstance(req.params.accountId);
      } catch (error) {
        // Ignore disconnect errors, account might already be disconnected
      }

      // Delete from database
      await prisma.whatsAppAccount.delete({
        where: {
          id: req.params.accountId,
          companyId: req.companyId!,
        },
      });

      res.json({ success: true, message: 'Account deleted' });
    } catch (error) {
      next(error);
    }
  });
}
