/**
 * CRM - Deals List Route
 * GET /api/v1/crm/deals
 * List all deals with filters and pagination
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupDealsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/deals`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          stage,
          ownerId,
          page = '1',
          limit = '20',
          pipelineId,
        } = req.query as any;

        const where: any = { companyId: req.companyId! };
        if (stage) where.stage = stage;
        if (ownerId) where.ownerId = ownerId;
        if (pipelineId) where.pipelineId = pipelineId;

        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [deals, total] = await Promise.all([
          prisma.deal.findMany({
            where,
            skip,
            take: parseInt(limit as string),
            include: {
              contact: { select: { id: true, name: true, email: true } },
              owner: { select: { id: true, name: true, email: true } },
              products: true,
              pipeline: true,
              stageRef: true,
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.deal.count({ where }),
        ]);

        res.json({
          success: true,
          data: deals,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
