/**
 * CRM - Interactions List Route
 * GET /api/v1/crm/interactions
 * List interactions with filters
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupInteractionsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/interactions`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { contactId, dealId, type, limit = '50' } = req.query as any;

        const where: any = { companyId: req.companyId! };
        if (contactId) where.contactId = contactId;
        if (dealId) where.dealId = dealId;
        if (type) where.type = type;

        const interactions = await prisma.interaction.findMany({
          where,
          take: parseInt(limit as string),
          include: {
            user: { select: { id: true, name: true, email: true } },
            contact: { select: { id: true, name: true } },
            deal: { select: { id: true, title: true } },
          },
          orderBy: { timestamp: 'desc' },
        });

        res.json({ success: true, data: interactions });
      } catch (error) {
        next(error);
      }
    }
  );
}
