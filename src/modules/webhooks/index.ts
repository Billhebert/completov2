// src/modules/webhooks/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../core/middleware';
import { WebhookService } from './service';
import { z } from 'zod';
import crypto from 'crypto';

const createSubscriptionSchema = z.object({
  url: z.string().url(),
  events: z.array(z.string()),
  description: z.string().optional(),
});

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/webhooks';
  const webhookService = new WebhookService(prisma);

  // List subscriptions
  app.get(`${base}/subscriptions`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const subscriptions = await prisma.webhookSubscription.findMany({
        where: { companyId: req.companyId! },
        select: {
          id: true,
          url: true,
          events: true,
          description: true,
          active: true,
          createdAt: true,
          _count: { select: { deliveries: true } },
        },
      });

      res.json({ success: true, data: subscriptions });
    } catch (error) {
      next(error);
    }
  });

  // Create subscription
  app.post(
    `${base}/subscriptions`,
    authenticate,
    tenantIsolation,
    validateBody(createSubscriptionSchema),
    async (req, res, next) => {
      try {
        const secret = crypto.randomBytes(32).toString('hex');

        const subscription = await prisma.webhookSubscription.create({
          data: {
            companyId: req.companyId!,
            url: req.body.url,
            events: req.body.events,
            description: req.body.description,
            secret,
            active: true,
          },
        });

        res.status(201).json({ success: true, data: subscription });
      } catch (error) {
        next(error);
      }
    }
  );

  // Update subscription
  app.patch(
    `${base}/subscriptions/:id`,
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        const subscription = await prisma.webhookSubscription.update({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
          },
          data: {
            url: req.body.url,
            events: req.body.events,
            description: req.body.description,
            active: req.body.active,
          },
        });

        res.json({ success: true, data: subscription });
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete subscription
  app.delete(`${base}/subscriptions/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      await prisma.webhookSubscription.delete({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
      });

      res.json({ success: true, message: 'Subscription deleted' });
    } catch (error) {
      next(error);
    }
  });

  // Get deliveries
  app.get(`${base}/deliveries`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const deliveries = await prisma.webhookDelivery.findMany({
        where: {
          subscription: { companyId: req.companyId! },
        },
        include: {
          subscription: {
            select: { url: true, events: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
      });

      res.json({ success: true, data: deliveries });
    } catch (error) {
      next(error);
    }
  });

  // Test webhook
  app.post(`${base}/test/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const subscription = await prisma.webhookSubscription.findFirst({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
      });

      if (!subscription) {
        return res.status(404).json({
          success: false,
          error: { message: 'Subscription not found' },
        });
      }

      await webhookService.send(req.companyId!, 'test.ping', {
        message: 'This is a test webhook',
        timestamp: new Date(),
      });

      res.json({ success: true, message: 'Test webhook sent' });
    } catch (error) {
      next(error);
    }
  });

  // Rotate secret
  app.post(`${base}/subscriptions/:id/rotate-secret`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const newSecret = crypto.randomBytes(32).toString('hex');

      const subscription = await prisma.webhookSubscription.update({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
        data: { secret: newSecret },
      });

      res.json({ success: true, data: { secret: subscription.secret } });
    } catch (error) {
      next(error);
    }
  });
}

export const webhooksModule: ModuleDefinition = {
  name: 'webhooks',
  version: '1.0.0',
  provides: ['webhooks', 'events'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
