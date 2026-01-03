import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/apikeys';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export const apikeysModule: ModuleDefinition = {
  name: 'apikeys',
  version: '1.0.0',
  provides: ['apikeys'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
