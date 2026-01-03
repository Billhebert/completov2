import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { ModuleDefinition } from '../../core/types';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/email-templates';
  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export const emailTemplatesModule: ModuleDefinition = {
  name: 'email-templates',
  version: '1.0.0',
  provides: ['email', 'templates'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
