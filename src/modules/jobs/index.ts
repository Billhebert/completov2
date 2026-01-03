/**
 * Jobs Module - Main Index
 * Ultra-modular architecture with CRUD factory
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';

// Import custom (non-CRUD) routes
import {
  setupJobsApplyRoute,
  setupJobsInterestRoute,
  setupJobsSuggestionsRoute,
  setupJobsApplicationsRoute,
  setupJobsUpdateApplicationRoute,
} from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/jobs';

  // Jobs CRUD via factory
  createCrudRoutes(app, prisma, {
    entityName: 'job',
    baseUrl: base,
    singularName: 'job',
    pluralName: 'jobs',
    tenantIsolation: true,
    auditLog: false,
    softDelete: false,
    allowedSortFields: ['title', 'location', 'salary', 'createdAt', 'closingDate'],

    list: {
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { applications: true, interests: true } },
      },
    },

    get: {
      include: {
        company: { select: { id: true, name: true } },
        _count: { select: { applications: true, interests: true } },
      },
    },

    create: {
      include: {
        company: { select: { id: true, name: true } },
      },
    },

    update: {
      include: {
        company: { select: { id: true, name: true } },
      },
    },

    customFilters: (query) => {
      const where: any = {};

      // Status filter
      if (query.status && typeof query.status === 'string') {
        where.status = query.status;
      }

      // Type filter
      if (query.type && typeof query.type === 'string') {
        where.type = query.type;
      }

      // Specialized filter
      if (query.isSpecialized !== undefined) {
        where.isSpecialized = query.isSpecialized === 'true';
      }

      // Search filter
      if (query.search && typeof query.search === 'string') {
        where.OR = [
          { title: { contains: query.search, mode: 'insensitive' } },
          { description: { contains: query.search, mode: 'insensitive' } },
          { location: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      return where;
    },
  });

  // Custom job routes (non-CRUD)
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
