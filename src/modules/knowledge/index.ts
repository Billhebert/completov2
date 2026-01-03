import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import * as routes from './routes';
import advancedRoutes from './advanced-routes';
import { initializeAutoConvert } from './auto-convert';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/knowledge';

  // Setup all modular routes
  Object.values(routes).forEach((setupFn: any) => {
    if (typeof setupFn === 'function') {
      setupFn(app, prisma, base);
    }
  });

  // Advanced routes (Reminders, Truth Layer)
  app.use(`${base}`, advancedRoutes);
}

export const knowledgeModule: ModuleDefinition = {
  name: 'knowledge',
  version: '1.0.0',
  provides: ['knowledge', 'graph', 'rag'],
  routes: (ctx) => {
    setupRoutes(ctx.app, ctx.prisma);

    // Initialize auto-convert service (converts everything to zettels)
    if (ctx.eventBus) {
      initializeAutoConvert(ctx.prisma, ctx.eventBus);
      console.log('✅ Auto-convert service initialized - Everything will become a zettel!');
    }
  },
};
