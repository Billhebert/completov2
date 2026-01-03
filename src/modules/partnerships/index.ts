/**
 * Partnerships Module
 */

import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import {
  setupPartnershipsListRoute,
  setupPartnershipsGetRoute,
  setupPartnershipsCreateRoute,
  setupPartnershipsUpdateRoute,
  setupPartnershipsDeleteRoute,
} from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/partnerships';
  setupPartnershipsListRoute(app, prisma, base);
  setupPartnershipsGetRoute(app, prisma, base);
  setupPartnershipsCreateRoute(app, prisma, base);
  setupPartnershipsUpdateRoute(app, prisma, base);
  setupPartnershipsDeleteRoute(app, prisma, base);
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
