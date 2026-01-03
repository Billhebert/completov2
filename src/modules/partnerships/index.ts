/**
 * Partnerships Module
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/partnerships';

  // Partnerships CRUD via factory
  createCrudRoutes(app, prisma, {
    entityName: 'partnership',
    baseUrl: base,
    singularName: 'partnership',
    pluralName: 'partnerships',
    tenantIsolation: true,
    auditLog: false,
    softDelete: false,
    allowedSortFields: ['createdAt', 'status', 'startDate'],

    list: {
      include: {
        companyA: { select: { id: true, name: true } },
        companyB: { select: { id: true, name: true } },
      },
    },

    get: {
      include: {
        companyA: { select: { id: true, name: true } },
        companyB: { select: { id: true, name: true } },
      },
    },

    create: {
      include: {
        companyA: { select: { id: true, name: true } },
        companyB: { select: { id: true, name: true } },
      },
    },

    update: {
      include: {
        companyA: { select: { id: true, name: true } },
        companyB: { select: { id: true, name: true } },
      },
    },

    customFilters: (query) => {
      const where: any = {};

      // Filter by status
      if (query.status && typeof query.status === 'string') {
        where.status = query.status;
      }

      // Filter by company (either A or B)
      if (query.companyId && typeof query.companyId === 'string') {
        where.OR = [
          { companyAId: query.companyId },
          { companyBId: query.companyId },
        ];
      }

      return where;
    },
  });
}

export const partnershipsModule: ModuleDefinition = {
  name: 'partnerships',
  version: '1.0.0',
  provides: ['partnerships'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};

// Helper function used by other modules
export async function getPartnerCompanyIds(companyId: string): Promise<string[]> {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();
  
  const partnerships = await prisma.partnership.findMany({
    where: {
      OR: [
        { companyAId: companyId, status: 'active' },
        { companyBId: companyId, status: 'active' },
      ],
    },
    select: { companyAId: true, companyBId: true },
  });

  return partnerships.map(p => p.companyAId === companyId ? p.companyBId : p.companyAId);
}

export default setupRoutes;
