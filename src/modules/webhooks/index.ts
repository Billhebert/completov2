// src/modules/webhooks/index.ts
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../core/middleware/auth';
import { tenantIsolation } from '../../core/middleware/tenant';
import { companyAdminOnly } from '../rbac/middleware';
import { WebhookService } from './webhook.service';
import crypto from 'crypto';

const prisma = new PrismaClient();
const webhookService = new WebhookService(prisma);

export default function registerWebhookRoutes(app: Express) {
  const base = '/api/v1/webhooks';

  // ===== Event Definitions =====
  
  app.get(`${base}/events`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const events = await prisma.eventDefinition.findMany({
        where: { companyId: req.companyId!, isActive: true },
        orderBy: { category: 'asc' },
      });
      res.json({ success: true, data: events });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/events`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      const { name, category, description, schema } = req.body;
      
      const event = await prisma.eventDefinition.create({
        data: {
          companyId: req.companyId!,
          name,
          category: category || 'custom',
          description,
          schema,
          createdBy: req.user!.id,
        },
      });
      
      res.json({ success: true, data: event });
    } catch (error) {
      next(error);
    }
  });

  // ===== Webhook Endpoints =====
  
  app.get(`${base}/endpoints`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const endpoints = await prisma.webhookEndpoint.findMany({
        where: { companyId: req.companyId! },
        select: {
          id: true,
          name: true,
          url: true,
          events: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { deliveries: true } },
        },
      });
      res.json({ success: true, data: endpoints });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${base}/endpoints`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      const { name, url, events, headers, timeout, retryConfig, description } = req.body;
      
      const endpoint = await prisma.webhookEndpoint.create({
        data: {
          companyId: req.companyId!,
          name,
          url,
          secret: crypto.randomBytes(32).toString('hex'),
          events: events || [],
          headers: headers || null,
          timeout: timeout || 30000,
          retryConfig: retryConfig || { maxRetries: 3, backoff: 'exponential' },
          description,
          createdBy: req.user!.id,
        },
      });
      
      res.json({ success: true, data: endpoint });
    } catch (error) {
      next(error);
    }
  });

  app.put(`${base}/endpoints/:id`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      const { id } = req.params;
      const { name, url, events, headers, timeout, retryConfig, isActive, description } = req.body;
      
      const endpoint = await prisma.webhookEndpoint.update({
        where: { id, companyId: req.companyId! },
        data: { name, url, events, headers, timeout, retryConfig, isActive, description },
      });
      
      res.json({ success: true, data: endpoint });
    } catch (error) {
      next(error);
    }
  });

  app.delete(`${base}/endpoints/:id`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      await prisma.webhookEndpoint.delete({
        where: { id: req.params.id, companyId: req.companyId! },
      });
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // ===== Delivery Logs =====
  
  app.get(`${base}/deliveries`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { endpointId, eventName, success, limit = 100 } = req.query;
      
      const where: any = {
        endpoint: { companyId: req.companyId! },
      };
      
      if (endpointId) where.endpointId = endpointId;
      if (eventName) where.eventName = eventName;
      if (success !== undefined) where.success = success === 'true';
      
      const deliveries = await prisma.webhookDeliveryLog.findMany({
        where,
        include: { endpoint: { select: { name: true, url: true } } },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
      });
      
      res.json({ success: true, data: deliveries });
    } catch (error) {
      next(error);
    }
  });

  // ===== Test Endpoint =====
  
  app.post(`${base}/test/:id`, authenticate, tenantIsolation, companyAdminOnly, async (req, res, next) => {
    try {
      const endpoint = await prisma.webhookEndpoint.findUnique({
        where: { id: req.params.id, companyId: req.companyId! },
      });
      
      if (!endpoint) {
        return res.status(404).json({ success: false, error: { message: 'Endpoint not found' } });
      }
      
      await webhookService.emitEvent({
        companyId: req.companyId!,
        eventName: 'test.webhook',
        payload: { message: 'Test webhook delivery', timestamp: new Date() },
      });
      
      res.json({ success: true, message: 'Test webhook dispatched' });
    } catch (error) {
      next(error);
    }
  });
}

export { webhookService };
