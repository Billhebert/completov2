import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModuleDefinition } from '../../core/types';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/analytics';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export const analyticsModule: ModuleDefinition = {
  name: 'analytics',
  version: '1.0.0',
  provides: ['analytics', 'reporting'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
