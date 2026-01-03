/**
 * CRM - Deals Delete Route
 * DELETE /api/v1/crm/deals/:id
 * Delete a deal and all related data (cascade)
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupDealsDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(
    `${baseUrl}/deals/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const deal = await prisma.deal.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
        });

        if (!deal) {
          return res
            .status(404)
            .json({ success: false, message: 'Deal não encontrado' });
        }

        // Delete in transaction: products first, then interactions, then deal
        await prisma.$transaction(async (tx) => {
          // Delete all products of this deal
          await tx.dealProduct.deleteMany({
            where: { dealId: req.params.id },
          });

          // Delete all interactions of this deal
          await tx.interaction.deleteMany({
            where: { dealId: req.params.id },
          });

          // Delete the deal
          await tx.deal.delete({
            where: { id: req.params.id },
          });
        });

        res.json({ success: true, message: 'Deal deleted' });
      } catch (error) {
        next(error);
      }
    }
  );
}
