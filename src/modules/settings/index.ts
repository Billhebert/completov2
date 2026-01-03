/**
 * Settings Module - Main Index
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import { setupSettingsGetRoute, setupSettingsUpdateRoute } from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/settings';
  setupSettingsGetRoute(app, prisma, base);
  setupSettingsUpdateRoute(app, prisma, base);
}

export const settingsModule: ModuleDefinition = {
  name: 'settings',
  version: '1.0.0',
  provides: ['settings'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};

export default setupRoutes;
