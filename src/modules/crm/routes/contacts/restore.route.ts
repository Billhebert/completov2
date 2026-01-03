/**
 * CRM - Contacts Restore Route
 * POST /api/v1/crm/contacts/:id/restore
 * Restore a soft-deleted contact and optionally its related entities
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

export function setupContactsRestoreRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(
    `${baseUrl}/contacts/:id/restore`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Verify contact exists, belongs to tenant, and is soft-deleted
        const contact = await prisma.contact.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
            deletedAt: { not: null },
          },
          include: {
            _count: {
              select: {
                deals: true,
                interactions: true,
              },
            },
          },
        });

        if (!contact) {
          return notFoundResponse(res, 'Contact not found or not deleted');
        }

        // Option to restore related entities
        const restoreRelated = req.body?.restoreRelated !== false; // Default true

        // Restore contact and optionally related entities
        await prisma.$transaction(async (tx) => {
          if (restoreRelated) {
            // 1. Restore all deals of this contact
            await tx.deal.updateMany({
              where: {
                contactId: req.params.id,
                deletedAt: { not: null },
              },
              data: {
                deletedAt: null,
              },
            });

            // 2. Restore all interactions of this contact
            await tx.interaction.updateMany({
              where: {
                contactId: req.params.id,
                deletedAt: { not: null },
              },
              data: {
                deletedAt: null,
              },
            });
          }

          // 3. Restore the contact
          await tx.contact.update({
            where: { id: req.params.id },
            data: {
              deletedAt: null,
            },
          });
        });

        // Count restored related records
        const restoredCounts = restoreRelated
          ? {
              deals: await prisma.deal.count({
                where: {
                  contactId: req.params.id,
                  deletedAt: null,
                },
              }),
              interactions: await prisma.interaction.count({
                where: {
                  contactId: req.params.id,
                  deletedAt: null,
                },
              }),
            }
          : { deals: 0, interactions: 0 };

        // Audit log the restoration
        await auditLogger.log({
          action: 'contact.restore',
          userId: req.user!.id,
          companyId: req.companyId!,
          resourceType: 'contact',
          resourceId: contact.id,
          details: {
            contactName: contact.name,
            contactEmail: contact.email,
            restoreRelated,
            restoredCounts,
          },
        });

        return successResponse(
          res,
          {
            id: contact.id,
            restored: true,
            restoredRelated: restoreRelated,
            restoredCounts,
          },
          {
            message: 'Contact restored successfully',
            requestId: req.id,
          }
        );
      } catch (error) {
        next(error);
      }
    }
  );
}
