import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../../core/event-bus';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { EvolutionAPIService } from '../evolution.service';
import { z } from 'zod';

const createAccountSchema = z.object({
  name: z.string(),
  instanceName: z.string(),
  apiUrl: z.string().url(),
  apiKey: z.string(),
  webhookUrl: z.string().url().optional(),
});

export function setupOmnichannelAccountsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string, eventBus: EventBus) {
  app.post(`${baseUrl}/whatsapp/accounts`, authenticate, tenantIsolation, validateBody(createAccountSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const evolutionService = new EvolutionAPIService(prisma, eventBus);
      const host = req.get('host');
      const defaultWebhook = `${req.protocol}://${host}/api/v1/omnichannel/webhooks/whatsapp`;

      const account = await prisma.whatsAppAccount.create({
        data: {
          companyId: req.companyId!,
          name: req.body.name,
          instanceName: req.body.instanceName,
          apiUrl: req.body.apiUrl,
          apiKey: req.body.apiKey,
          webhookUrl: req.body.webhookUrl || defaultWebhook,
        },
      });

      await evolutionService.initInstance(account.id);

      res.status(201).json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  });
}
