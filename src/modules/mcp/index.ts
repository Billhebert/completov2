import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModuleDefinition } from '../../core/types';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/mcp';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export const mcpModule: ModuleDefinition = {
  name: 'mcp',
  version: '1.0.0',
  provides: ['mcp', 'servers'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};

export default function registerMCPRoutes(app: Express) {
  // Legacy export for compatibility
  const prisma = new PrismaClient();
  setupRoutes(app, prisma);
}
