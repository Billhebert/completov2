// src/modules/omnichannel/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { authenticate, tenantIsolation, validateBody } from '../../core/middleware';
import { EvolutionAPIService } from './evolution.service';
import { z } from 'zod';

const createAccountSchema = z.object({
  name: z.string(),
  instanceName: z.string(),
  apiUrl: z.string().url(),
  apiKey: z.string(),
  webhookUrl: z.string().url().optional(),
});

const sendMessageSchema = z.object({
  to: z.string(),
  text: z.string(),
});

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/omnichannel';
  const evolutionService = new EvolutionAPIService(prisma, eventBus);

  // List WhatsApp accounts
  app.get(`${base}/whatsapp/accounts`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const accounts = await prisma.whatsAppAccount.findMany({
        where: { companyId: req.companyId! },
        select: {
          id: true,
          name: true,
          instanceName: true,
          status: true,
          lastConnectedAt: true,
          createdAt: true,
        },
      });
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  });

  // Create WhatsApp account
  app.post(`${base}/whatsapp/accounts`, authenticate, tenantIsolation, validateBody(createAccountSchema), async (req, res, next) => {
    try {
      const account = await prisma.whatsAppAccount.create({
        data: {
          companyId: req.companyId!,
          name: req.body.name,
          instanceName: req.body.instanceName,
          apiUrl: req.body.apiUrl,
          apiKey: req.body.apiKey,
          webhookUrl: req.body.webhookUrl || `${req.protocol}://${req.get('host')}/api/v1/omnichannel/webhooks/whatsapp`,
        },
      });

      // Initialize instance
      await evolutionService.initInstance(account.id);

      res.status(201).json({ success: true, data: account });
    } catch (error) {
      next(error);
    }
  });

  // Get QR code
  app.get(`${base}/whatsapp/accounts/:accountId/qrcode`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const qr = await evolutionService.getQRCode(req.params.accountId);
      res.json({ success: true, data: qr });
    } catch (error) {
      next(error);
    }
  });

  // Send message
  app.post(`${base}/whatsapp/accounts/:accountId/send`, authenticate, tenantIsolation, validateBody(sendMessageSchema), async (req, res, next) => {
    try {
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

  // Get conversations
  app.get(`${base}/conversations`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const conversations = await prisma.conversation.findMany({
        where: { companyId: req.companyId! },
        orderBy: { lastMessageAt: 'desc' },
        take: 50,
        include: {
          assignments: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      });
      res.json({ success: true, data: conversations });
    } catch (error) {
      next(error);
    }
  });

  // Webhook endpoint (public - no auth)
  app.post(`${base}/webhooks/whatsapp`, async (req, res, next) => {
    try {
      await evolutionService.handleWebhook(req.body);
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Get instance status
  app.get(`${base}/whatsapp/accounts/:accountId/status`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const status = await evolutionService.getInstanceStatus(req.params.accountId);
      res.json({ success: true, data: status });
    } catch (error) {
      next(error);
    }
  });

  // Disconnect instance
  app.post(`${base}/whatsapp/accounts/:accountId/disconnect`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      await evolutionService.disconnectInstance(req.params.accountId);
      res.json({ success: true, message: 'Instance disconnected' });
    } catch (error) {
      next(error);
    }
  });
}

export const omnichannelModule: ModuleDefinition = {
  name: 'omnichannel',
  version: '1.0.0',
  provides: ['whatsapp', 'conversations'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
