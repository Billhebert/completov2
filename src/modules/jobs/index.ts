/**
 * Jobs Module - Main Index
 * Ultra-modular architecture - each route in its own file
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';

// Import all modular routes
import {
  setupJobsListRoute,
  setupJobsGetRoute,
  setupJobsCreateRoute,
  setupJobsUpdateRoute,
  setupJobsDeleteRoute,
  setupJobsApplyRoute,
  setupJobsInterestRoute,
  setupJobsSuggestionsRoute,
  setupJobsApplicationsRoute,
  setupJobsUpdateApplicationRoute,
} from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/jobs';

  // Setup all modular routes
  setupJobsListRoute(app, prisma, base);
  setupJobsGetRoute(app, prisma, base);
  setupJobsCreateRoute(app, prisma, base);
  setupJobsUpdateRoute(app, prisma, base);
  setupJobsDeleteRoute(app, prisma, base);
  setupJobsApplyRoute(app, prisma, base);
  setupJobsInterestRoute(app, prisma, base);
  setupJobsSuggestionsRoute(app, prisma, base);
  setupJobsApplicationsRoute(app, prisma, base);
  setupJobsUpdateApplicationRoute(app, prisma, base);
}

export const jobsModule: ModuleDefinition = {
  name: 'jobs',
  version: '1.0.0',
  provides: ['jobs', 'recruitment', 'applications'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
