/**
 * CRM - Deals Delete Route
 * DELETE /api/v1/crm/deals/:id
 * Soft delete a deal and cascade to related entities
 *
 * Security:
 * - Uses soft delete (sets deletedAt timestamp)
 * - Related interactions also soft-deleted
 * - Audit logging enabled
 * - Can be restored via restore endpoint
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';
import { notDeleted } from '../../../../core/utils/soft-delete';
import { auditLogger } from '../../../../core/audit/audit-logger';
import { successResponse, notFoundResponse } from '../../../../core/utils/api-response';

export function setupDealsDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(
    `${baseUrl}/deals/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Verify deal exists, belongs to tenant, and is not already deleted
        const deal = await prisma.deal.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
            ...notDeleted,
          },
          include: {
            _count: {
              select: {
                interactions: true,
              },
            },
          },
        });

        if (!deal) {
          return notFoundResponse(res, 'Deal not found or already deleted');
        }

        const now = new Date();

        // Soft delete: deal and cascade to related entities
        await prisma.$transaction(async (tx) => {
          // 1. Soft delete all interactions of this deal
          await tx.interaction.updateMany({
            where: {
              dealId: req.params.id,
              deletedAt: null,
            },
            data: {
              deletedAt: now,
            },
          });

          // 2. Soft delete the deal
          await tx.deal.update({
            where: { id: req.params.id },
            data: {
              deletedAt: now,
            },
          });

          // Note: Deal products are not soft-deleted as they don't have deletedAt
          // They remain linked to the deal for restoration purposes
        });

        // Audit log the deletion
        await auditLogger.log({
          action: 'deal.delete',
          userId: req.user!.id,
          companyId: req.companyId!,
          resourceType: 'deal',
          resourceId: deal.id,
          details: {
            dealTitle: deal.title,
            dealValue: deal.value,
            cascadeDeleted: {
              interactions: deal._count.interactions,
            },
          },
        });

        return successResponse(
          res,
          {
            id: deal.id,
            deletedAt: now,
            cascadeDeleted: {
              interactions: deal._count.interactions,
            },
          },
          {
            message: 'Deal soft-deleted successfully. Can be restored within 30 days.',
            requestId: req.id,
          }
        );
      } catch (error) {
        next(error);
      }
    }
  );
}
