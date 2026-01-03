/**
 * CRM - Analytics Pipeline Route
 * GET /api/v1/crm/analytics/pipeline
 * Get pipeline analytics (deals grouped by stage)
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupAnalyticsPipelineRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/analytics/pipeline`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const pipeline = await prisma.deal.groupBy({
          by: ['stage'],
          where: { companyId: req.companyId! },
          _count: true,
          _sum: { value: true },
        });

        res.json({ success: true, data: pipeline });
      } catch (error) {
        next(error);
      }
    }
  );
}
