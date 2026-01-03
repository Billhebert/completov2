import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModuleDefinition } from '../../core/types';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/ai';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export const aiModule: ModuleDefinition = {
  name: 'ai',
  version: '1.0.0',
  provides: ['ai', 'rag'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
