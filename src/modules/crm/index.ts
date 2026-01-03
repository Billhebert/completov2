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

// Import NEW modular routes - Interactions
import {
  setupInteractionsCreateRoute,
  setupInteractionsListRoute,
} from './routes/interactions';

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
  // NEW ULTRA-MODULAR ROUTES - INTERACTIONS
  // =========================================================
  setupInteractionsCreateRoute(app, prisma, base);
  setupInteractionsListRoute(app, prisma, base);

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
