/**
 * CRM - Contacts Update Route
 * PATCH /api/v1/crm/contacts/:id
 * Update an existing contact
 *
 * Security:
 * - Schema validation prevents mass assignment
 * - Tenant isolation verified before update
 * - Audit trail with updatedBy
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { updateContactSchema } from '../../schemas/contact.schema';
import { successResponse, notFoundResponse } from '../../../../core/utils/api-response';

export function setupContactsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(
    `${baseUrl}/contacts/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(updateContactSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        // 1. Verify ownership (tenant isolation)
        const existing = await prisma.contact.findFirst({
          where: {
            id: req.params.id,
            companyId: req.companyId!, // CRITICAL: Ensure resource belongs to user's company
          },
        });

        if (!existing) {
          return notFoundResponse(res, 'Contact not found');
        }

        // 2. Update with validated data only
        const contact = await prisma.contact.update({
          where: { id: req.params.id },
          data: {
            ...req.body, // Safe - validated by schema
            updatedAt: new Date(),
            updatedBy: req.user!.id, // Audit trail
          },
          include: {
            updatedByUser: {
              select: { id: true, name: true, email: true },
            },
          },
        });

        return successResponse(res, contact, {
          requestId: req.id,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
