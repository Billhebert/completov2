/**
 * CRM - Contacts Delete Route
 * DELETE /api/v1/crm/contacts/:id
 * Soft delete a contact and cascade to related entities
 *
 * Security:
 * - Uses soft delete (sets deletedAt timestamp)
 * - Related deals and interactions also soft-deleted
 * - Audit logging enabled
 * - Can be restored via restore endpoint
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';
import { notDeleted } from '../../../../core/utils/soft-delete';
import { auditLogger } from '../../../../core/audit/audit-logger';
import { successResponse, notFoundResponse } from '../../../../core/utils/api-response';

export function setupContactsDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(
    `${baseUrl}/contacts/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Verify contact exists, belongs to tenant, and is not already deleted
        const contact = await prisma.contact.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!,
            ...notDeleted,
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
          return notFoundResponse(res, 'Contact not found or already deleted');
        }

        const now = new Date();

        // Soft delete: contact and cascade to related entities
        await prisma.$transaction(async (tx) => {
          // 1. Soft delete all deals of this contact
          await tx.deal.updateMany({
            where: {
              contactId: req.params.id,
              deletedAt: null,
            },
            data: {
              deletedAt: now,
            },
          });

          // 2. Soft delete all interactions of this contact
          await tx.interaction.updateMany({
            where: {
              contactId: req.params.id,
              deletedAt: null,
            },
            data: {
              deletedAt: now,
            },
          });

          // 3. Soft delete the contact
          await tx.contact.update({
            where: { id: req.params.id },
            data: {
              deletedAt: now,
            },
          });
        });

        // Audit log the deletion
        await auditLogger.log({
          action: 'contact.delete',
          userId: req.user!.id,
          companyId: req.companyId!,
          resourceType: 'contact',
          resourceId: contact.id,
          details: {
            contactName: contact.name,
            contactEmail: contact.email,
            cascadeDeleted: {
              deals: contact._count.deals,
              interactions: contact._count.interactions,
            },
          },
        });

        return successResponse(
          res,
          {
            id: contact.id,
            deletedAt: now,
            cascadeDeleted: {
              deals: contact._count.deals,
              interactions: contact._count.interactions,
            },
          },
          {
            message: 'Contact soft-deleted successfully. Can be restored within 30 days.',
            requestId: req.id,
          }
        );
      } catch (error) {
        next(error);
      }
    }
  );
}
