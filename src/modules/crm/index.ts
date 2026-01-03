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

// Import custom (non-CRUD) routes for Contacts
import {
  setupContactsRestoreRoute,
  setupContactsEnrichRoute,
  setupContactsEngagementRoute,
  setupContactsChurnRoute,
} from './routes/contacts';

// Import custom (non-CRUD) routes for Deals
import {
  setupDealsRestoreRoute,
  setupDealsMoveStageRoute,
  setupDealsProbabilityRoute,
} from './routes/deals';

// Import CRUD factory for simple entities
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';
import { createInteractionSchema } from './schemas/interaction.schema';
import { createContactSchema, updateContactSchema } from './schemas/contact.schema';
import { createDealSchema, updateDealSchema } from './schemas/deal.schema';
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
  // CONTACTS - Using CRUD Factory
  // =========================================================
  createCrudRoutes(app, prisma, {
    entityName: 'contact',
    baseUrl: `${base}/contacts`,
    singularName: 'contact',
    pluralName: 'contacts',
    tenantIsolation: true,
    auditLog: true,
    softDelete: true,
    allowedSortFields: ['name', 'email', 'createdAt', 'updatedAt', 'lastContactedAt', 'leadScore'],
    readPermission: Permission.CONTACT_READ,
    createPermission: Permission.CONTACT_CREATE,
    updatePermission: Permission.CONTACT_CREATE,
    deletePermission: Permission.CONTACT_CREATE,

    create: {
      schema: createContactSchema,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        crmCompany: { select: { id: true, name: true, status: true } },
      },
      beforeOperation: async (req, data) => {
        // Normalize email
        if (data.email) {
          data.email = String(data.email).trim().toLowerCase();
        }
        data.ownerId = req.user!.id;
      },
    },

    list: {
      include: {
        owner: { select: { id: true, name: true, email: true } },
        crmCompany: { select: { id: true, name: true, status: true } },
        _count: { select: { deals: true, interactions: true } },
      },
    },

    get: {
      include: {
        owner: { select: { id: true, name: true, email: true } },
        crmCompany: { select: { id: true, name: true, status: true } },
        deals: true,
        interactions: { orderBy: { timestamp: 'desc' }, take: 10 },
        _count: { select: { deals: true, interactions: true } },
      },
    },

    update: {
      schema: updateContactSchema,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        crmCompany: { select: { id: true, name: true, status: true } },
      },
      beforeOperation: async (req, data) => {
        // Normalize email if provided
        if (data.email) {
          data.email = String(data.email).trim().toLowerCase();
        }
        data.updatedBy = req.user!.id;
      },
    },

    customFilters: (query) => {
      const where: any = {};

      // Search filter
      if (query.search && typeof query.search === 'string') {
        where.OR = [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
          { companyName: { contains: query.search, mode: 'insensitive' } },
        ];
      }

      // Tag filter
      if (query.tag && typeof query.tag === 'string') {
        where.tags = { has: query.tag };
      }

      // Lead status filter
      if (query.leadStatus && typeof query.leadStatus === 'string') {
        where.leadStatus = query.leadStatus;
      }

      // Owner filter
      if (query.ownerId && typeof query.ownerId === 'string') {
        where.ownerId = query.ownerId;
      }

      return where;
    },
  });

  // Custom contact routes (non-CRUD)
  setupContactsRestoreRoute(app, prisma, base);
  setupContactsEnrichRoute(app, prisma, base);
  setupContactsEngagementRoute(app, prisma, base);
  setupContactsChurnRoute(app, prisma, base);

  // =========================================================
  // DEALS - Using CRUD Factory
  // =========================================================
  createCrudRoutes(app, prisma, {
    entityName: 'deal',
    baseUrl: `${base}/deals`,
    singularName: 'deal',
    pluralName: 'deals',
    tenantIsolation: true,
    auditLog: true,
    softDelete: true,
    allowedSortFields: ['title', 'value', 'createdAt', 'updatedAt', 'expectedCloseDate', 'closedDate', 'probability'],
    readPermission: Permission.CONTACT_READ,
    createPermission: Permission.CONTACT_CREATE,
    updatePermission: Permission.CONTACT_CREATE,
    deletePermission: Permission.CONTACT_CREATE,

    create: {
      schema: createDealSchema,
      include: {
        contact: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        products: true,
        pipeline: true,
        stageRef: true,
      },
      beforeOperation: async (req, data) => {
        data.ownerId = req.user!.id;
      },
      afterOperation: async (req, result) => {
        // Emit event for deal creation
        if (eventBus) {
          eventBus.emit('deal.created', { dealId: result.id, companyId: req.companyId });
        }
      },
    },

    list: {
      include: {
        contact: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        products: true,
        pipeline: true,
        stageRef: true,
      },
    },

    get: {
      include: {
        contact: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        products: true,
        pipeline: true,
        stageRef: true,
        interactions: { orderBy: { timestamp: 'desc' }, take: 10 },
      },
    },

    update: {
      schema: updateDealSchema,
      include: {
        contact: { select: { id: true, name: true, email: true } },
        owner: { select: { id: true, name: true, email: true } },
        products: true,
        pipeline: true,
        stageRef: true,
      },
      beforeOperation: async (req, data) => {
        data.updatedBy = req.user!.id;
      },
    },

    customFilters: (query) => {
      const where: any = {};

      // Stage filter
      if (query.stage && typeof query.stage === 'string') {
        where.stage = query.stage;
      }

      // Owner filter
      if (query.ownerId && typeof query.ownerId === 'string') {
        where.ownerId = query.ownerId;
      }

      // Pipeline filter
      if (query.pipelineId && typeof query.pipelineId === 'string') {
        where.pipelineId = query.pipelineId;
      }

      // Stage reference filter
      if (query.stageId && typeof query.stageId === 'string') {
        where.stageId = query.stageId;
      }

      // Value range filter
      if (query.minValue || query.maxValue) {
        where.value = {};
        if (query.minValue) where.value.gte = parseFloat(query.minValue as string);
        if (query.maxValue) where.value.lte = parseFloat(query.maxValue as string);
      }

      return where;
    },
  });

  // Custom deal routes (non-CRUD)
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
