import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  createCrudRoutes(app, prisma, {
    entityName: 'feedback',
    baseUrl: '/api/v1/feedback',
    singularName: 'feedback',
    pluralName: 'feedback',
    tenantIsolation: true,
    auditLog: false,
    softDelete: false,
    allowedSortFields: ['createdAt', 'rating', 'type'],

    // Disable operations not yet implemented
    get: { enabled: false },
    update: { enabled: false },
    delete: { enabled: false },
  });
}

export const feedbackModule: ModuleDefinition = {
  name: 'feedback',
  version: '1.0.0',
  provides: ['feedback'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
