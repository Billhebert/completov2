// src/modules/services/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/services';

  // Basic CRUD routes
  routes.setupServicesListRoute(app, prisma, base);
  routes.setupServicesGetRoute(app, prisma, base);
  routes.setupServicesCreateRoute(app, prisma, base);
  routes.setupServicesUpdateRoute(app, prisma, base);
  routes.setupServicesDeleteRoute(app, prisma, base);

  // Proposal routes
  routes.setupServicesProposeRoute(app, prisma, base);
  routes.setupServicesProposalsListRoute(app, prisma, base);
  routes.setupServicesProposalAcceptRoute(app, prisma, base);
  routes.setupServicesProposalRejectRoute(app, prisma, base);

  // Completion and rating routes
  routes.setupServicesCompleteRoute(app, prisma, base);
  routes.setupServicesRateRoute(app, prisma, base);

  // Transaction routes
  routes.setupServicesTransactionsListRoute(app, prisma, base);
  routes.setupServicesTransactionPaymentRoute(app, prisma, base);
}

export const servicesModule: ModuleDefinition = {
  name: 'services',
  version: '1.0.0',
  provides: ['services', 'marketplace', 'proposals'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
