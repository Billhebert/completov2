import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/rbac';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export const rbacModule: ModuleDefinition = {
  name: 'rbac',
  version: '1.0.0',
  provides: ['rbac'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
