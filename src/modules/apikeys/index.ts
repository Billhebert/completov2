import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';
import crypto from 'crypto';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  createCrudRoutes(app, prisma, {
    entityName: 'apiKey',
    baseUrl: '/api/v1/apikeys',
    singularName: 'API key',
    pluralName: 'API keys',
    tenantIsolation: true,
    auditLog: false,
    softDelete: false,
    allowedSortFields: ['name', 'createdAt'],

    create: {
      beforeOperation: async (req, data) => {
        // Gera chave única
        data.key = crypto.randomBytes(32).toString('hex');
        data.createdBy = (req as any).user?.id || (req as any).userId;
      },
    },

    // GET não é necessário para API keys
    get: {
      enabled: false,
    },

    // UPDATE não é necessário para API keys
    update: {
      enabled: false,
    },
  });
}

export const apikeysModule: ModuleDefinition = {
  name: 'apikeys',
  version: '1.0.0',
  provides: ['apikeys'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
