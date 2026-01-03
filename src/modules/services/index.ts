// src/modules/services/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/services';

  // Services CRUD via factory
  createCrudRoutes(app, prisma, {
    entityName: 'service',
    baseUrl: base,
    singularName: 'service',
    pluralName: 'services',
    tenantIsolation: true,
    auditLog: false,
    softDelete: false,
    allowedSortFields: ['title', 'price', 'createdAt', 'rating'],

    list: {
      include: {
        provider: { select: { id: true, name: true } },
        _count: { select: { proposals: true } },
      },
    },

    get: {
      include: {
        provider: { select: { id: true, name: true } },
        proposals: true,
        transactions: true,
        _count: { select: { proposals: true } },
      },
    },

    create: {
      include: {
        provider: { select: { id: true, name: true } },
      },
      beforeOperation: async (req, data) => {
        data.providerId = req.user!.id;
      },
    },

    update: {
      include: {
        provider: { select: { id: true, name: true } },
      },
    },

    customFilters: (query) => {
      const where: any = {};

      // Status filter
      if (query.status && typeof query.status === 'string') {
        where.status = query.status;
      }

      // Category filter
      if (query.category && typeof query.category === 'string') {
        where.category = query.category;
      }

      // Price range filter
      if (query.minPrice || query.maxPrice) {
        where.price = {};
        if (query.minPrice) where.price.gte = parseFloat(query.minPrice as string);
        if (query.maxPrice) where.price.lte = parseFloat(query.maxPrice as string);
      }

      return where;
    },
  });

  // Proposal routes (custom business logic)
  routes.setupServicesProposeRoute(app, prisma, base);
  routes.setupServicesProposalsListRoute(app, prisma, base);
  routes.setupServicesProposalAcceptRoute(app, prisma, base);
  routes.setupServicesProposalRejectRoute(app, prisma, base);

  // Completion and rating routes (custom business logic)
  routes.setupServicesCompleteRoute(app, prisma, base);
  routes.setupServicesRateRoute(app, prisma, base);

  // Transaction routes (custom business logic)
  routes.setupServicesTransactionsListRoute(app, prisma, base);
  routes.setupServicesTransactionPaymentRoute(app, prisma, base);
}

export const servicesModule: ModuleDefinition = {
  name: 'services',
  version: '1.0.0',
  provides: ['services', 'marketplace', 'proposals'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
