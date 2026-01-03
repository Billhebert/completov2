/**
 * CRM - Deals Restore Route
 * POST /api/v1/crm/deals/:id/restore
 * Restore a soft-deleted deal and optionally its related entities
 *
 * Security:
 * - Only restores soft-deleted records (deletedAt IS NOT NULL)
 * - Tenant isolation enforced
 * - Audit logging enabled
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';
import { auditLogger } from '../../../../core/audit/audit-logger';
import { successResponse, notFoundResponse } from '../../../../core/utils/api-response';

export function setupDealsRestoreRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(
    `${baseUrl}/deals/:id/restore`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Verify deal exists, belongs to tenant, and is soft-deleted
        const deal = await prisma.deal.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
            deletedAt: { not: null },
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
          return notFoundResponse(res, 'Deal not found or not deleted');
        }

        // Option to restore related entities
        const restoreRelated = req.body?.restoreRelated !== false; // Default true

        // Restore deal and optionally related entities
        await prisma.$transaction(async (tx) => {
          if (restoreRelated) {
            // 1. Restore all interactions of this deal
            await tx.interaction.updateMany({
              where: {
                dealId: req.params.id,
                deletedAt: { not: null },
              },
              data: {
                deletedAt: null,
              },
            });
          }

          // 2. Restore the deal
          await tx.deal.update({
            where: { id: req.params.id },
            data: {
              deletedAt: null,
            },
          });
        });

        // Count restored related records
        const restoredCounts = restoreRelated
          ? {
              interactions: await prisma.interaction.count({
                where: {
                  dealId: req.params.id,
                  deletedAt: null,
                },
              }),
            }
          : { interactions: 0 };

        // Audit log the restoration
        await auditLogger.log({
          action: 'deal.restore',
          userId: req.user!.id,
          companyId: req.companyId!,
          resourceType: 'deal',
          resourceId: deal.id,
          details: {
            dealTitle: deal.title,
            dealValue: deal.value,
            restoreRelated,
            restoredCounts,
          },
        });

        return successResponse(
          res,
          {
            id: deal.id,
            restored: true,
            restoreRelated,
            restoredCounts,
          },
          {
            message: 'Deal restored successfully',
            requestId: req.id,
          }
        );
      } catch (error) {
        next(error);
      }
    }
  );
}
