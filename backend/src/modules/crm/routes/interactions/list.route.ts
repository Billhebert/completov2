/**
 * CRM - Interactions List Route
 * GET /api/v1/crm/interactions
 * List interactions with filters
 *
 * Security:
 * - Query parameter validation
 * - Pagination limits enforced
 * - Tenant isolation
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateQuery } from '../../../../core/middleware';
import { listInteractionSchema } from '../../schemas/interaction.schema';
import { successResponse } from '../../../../core/utils/api-response';

export function setupInteractionsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/interactions`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    validateQuery(listInteractionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { contactId, dealId, type, limit, offset } = req.query as any;

        const where: any = { companyId: req.companyId! };
        if (contactId) where.contactId = contactId;
        if (dealId) where.dealId = dealId;
        if (type) where.type = type;

        const [interactions, total] = await Promise.all([
          prisma.interaction.findMany({
            where,
            take: limit || 50,
            skip: offset || 0,
            include: {
              user: { select: { id: true, name: true, email: true } },
              contact: { select: { id: true, name: true } },
              deal: { select: { id: true, title: true } },
            },
            orderBy: { timestamp: 'desc' },
          }),
          prisma.interaction.count({ where }),
        ]);

        return successResponse(res, interactions, {
          meta: {
            total,
            limit: limit || 50,
            offset: offset || 0,
          },
          requestId: req.id,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
