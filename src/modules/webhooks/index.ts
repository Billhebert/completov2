import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';
import { setupWebhooksTestRoute } from './routes/test.route';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/webhooks';

  // CRUD routes via factory
  createCrudRoutes(app, prisma, {
    entityName: 'webhook',
    baseUrl: base,
    singularName: 'webhook',
    pluralName: 'webhooks',
    tenantIsolation: true,
    auditLog: false,
    softDelete: false,
    allowedSortFields: ['url', 'event', 'createdAt'],
  });

  // Custom test route
  setupWebhooksTestRoute(app, prisma, base);
}

export const webhooksModule: ModuleDefinition = {
  name: 'webhooks',
  version: '1.0.0',
  provides: ['webhooks'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
