import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModuleDefinition } from '../../core/types';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/people-growth';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export const peopleGrowthModule: ModuleDefinition = {
  name: 'people-growth',
  version: '1.0.0',
  provides: ['people-growth', 'gaps', 'development'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
