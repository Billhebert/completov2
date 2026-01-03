/**
 * CRM - Deals Get Route
 * GET /api/v1/crm/deals/:id
 * Get a specific deal by ID
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupDealsGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/deals/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            contact: { select: { id: true, name: true, email: true } },
            owner: { select: { id: true, name: true, email: true } },
            products: true,
            pipeline: true,
            stageRef: true,
            interactions: {
              orderBy: { timestamp: 'desc' },
              take: 10,
            },
          },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, error: { message: 'Deal not found' } });
        }

        res.json({ success: true, data: deal });
      } catch (error) {
        next(error);
      }
    }
  );
}
