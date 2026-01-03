import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModuleDefinition } from '../../core/types';
import { EventBus } from '../../core/event-bus';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/notifications';
  Object.values(routes).forEach(fn => fn(app, prisma, base, eventBus));
}

export const notificationsModule: ModuleDefinition = {
  name: 'notifications',
  version: '1.0.0',
  provides: ['notifications'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
