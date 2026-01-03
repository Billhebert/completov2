/**
 * CRM Module - Main Index
 * Ultra-modular architecture - each route in its own file
 */

import { ModuleDefinition } from '../../core/types';
import { Express, Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';

// Import existing route modules (already modular)
import { setupActivityRoutes } from './activities';
import { setupLeadScoringRoutes } from './lead-scoring';
import { setupImportExportRoutes } from './import-export';
import { setupCompanyRoutes } from './companies';
import { setupPipelineRoutes } from './pipelines';
import { setupDealHealthRuleRoutes } from './deal-health-rules';
import { setupDealHealthRoutes } from './deals-health';

// Import NEW modular routes - Contacts
import {
  setupContactsListRoute,
  setupContactsCreateRoute,
  setupContactsGetRoute,
  setupContactsUpdateRoute,
  setupContactsDeleteRoute,
  setupContactsRestoreRoute,
  setupContactsEnrichRoute,
  setupContactsEngagementRoute,
  setupContactsChurnRoute,
} from './routes/contacts';

// Import NEW modular routes - Deals
import {
  setupDealsListRoute,
  setupDealsCreateRoute,
  setupDealsGetRoute,
  setupDealsUpdateRoute,
  setupDealsDeleteRoute,
  setupDealsRestoreRoute,
  setupDealsMoveStageRoute,
  setupDealsProbabilityRoute,
} from './routes/deals';

// Import CRUD factory for simple entities
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';
import { createInteractionSchema } from './schemas/interaction.schema';
import { Permission } from '../../core/middleware';

// Import NEW modular routes - AI
import { setupAIRecommendationsRoute } from './routes/ai';

// Import NEW modular routes - Analytics
import { setupAnalyticsPipelineRoute } from './routes/analytics';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/crm';

  // =========================================================
  // EXISTING MODULAR ROUTES (Router-based)
  // =========================================================
  const router = Router();

  setupPipelineRoutes(router, prisma);
  setupCompanyRoutes(router, prisma);
  setupActivityRoutes(router, prisma, eventBus);
  setupLeadScoringRoutes(router, prisma);
  setupImportExportRoutes(router, prisma);
  setupDealHealthRuleRoutes(router, prisma);
  setupDealHealthRoutes(router, prisma);

  app.use(base, router);

  // =========================================================
  // NEW ULTRA-MODULAR ROUTES - CONTACTS
  // =========================================================
  setupContactsListRoute(app, prisma, base);
  setupContactsCreateRoute(app, prisma, base);
  setupContactsGetRoute(app, prisma, base);
  setupContactsUpdateRoute(app, prisma, base);
  setupContactsDeleteRoute(app, prisma, base);
  setupContactsRestoreRoute(app, prisma, base);
  setupContactsEnrichRoute(app, prisma, base);
  setupContactsEngagementRoute(app, prisma, base);
  setupContactsChurnRoute(app, prisma, base);

  // =========================================================
  // NEW ULTRA-MODULAR ROUTES - DEALS
  // =========================================================
  setupDealsListRoute(app, prisma, base);
  setupDealsCreateRoute(app, prisma, base, eventBus);
  setupDealsGetRoute(app, prisma, base);
  setupDealsUpdateRoute(app, prisma, base);
  setupDealsDeleteRoute(app, prisma, base);
  setupDealsRestoreRoute(app, prisma, base);
  setupDealsMoveStageRoute(app, prisma, base);
  setupDealsProbabilityRoute(app, prisma, base);

  // =========================================================
  // INTERACTIONS - Using CRUD Factory
  // =========================================================
  createCrudRoutes(app, prisma, {
    entityName: 'interaction',
    baseUrl: `${base}/interactions`,
    singularName: 'interaction',
    pluralName: 'interactions',
    tenantIsolation: true,
    auditLog: true,
    softDelete: false,
    allowedSortFields: ['timestamp', 'type', 'createdAt'],
    readPermission: Permission.CONTACT_READ,
    createPermission: Permission.CONTACT_CREATE,
    create: {
      schema: createInteractionSchema,
      include: {
        user: { select: { id: true, name: true, email: true } },
        contact: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
      beforeOperation: async (req, data) => {
        data.userId = req.user!.id;
      },
    },
    list: {
      include: {
        user: { select: { id: true, name: true, email: true } },
        contact: { select: { id: true, name: true } },
        deal: { select: { id: true, title: true } },
      },
    },
    customFilters: (query) => {
      const where: any = {};
      if (query.contactId) where.contactId = query.contactId;
      if (query.dealId) where.dealId = query.dealId;
      if (query.type) where.type = query.type;
      return where;
    },
    // Disable operations not needed
    get: { enabled: false },
    update: { enabled: false },
    delete: { enabled: false },
  });

  // =========================================================
  // NEW ULTRA-MODULAR ROUTES - AI
  // =========================================================
  setupAIRecommendationsRoute(app, prisma, base);

  // =========================================================
  // NEW ULTRA-MODULAR ROUTES - ANALYTICS
  // =========================================================
  setupAnalyticsPipelineRoute(app, prisma, base);
}

export const crmModule: ModuleDefinition = {
  name: 'crm',
  version: '1.0.0',
  provides: ['crm'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
