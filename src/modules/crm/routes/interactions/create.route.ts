/**
 * CRM - Interactions Create Route
 * POST /api/v1/crm/interactions
 * Create a new interaction (call, email, meeting, note)
 *
 * Security:
 * - Schema validation prevents mass assignment
 * - Tenant isolation verified
 * - Audit trail logging
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { createInteractionSchema } from '../../schemas/interaction.schema';
import { auditLogger } from '../../../../core/audit/audit-logger';
import { successResponse } from '../../../../core/utils/api-response';

export function setupInteractionsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(
    `${baseUrl}/interactions`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(createInteractionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const validatedData = req.body; // Already validated by schema

        // Only include validated fields from schema
        const interaction = await prisma.interaction.create({
          data: {
            type: validatedData.type,
            contactId: validatedData.contactId,
            dealId: validatedData.dealId,
            subject: validatedData.subject,
            content: validatedData.content,
            direction: validatedData.direction,
            scheduledFor: validatedData.scheduledFor,
            companyId: req.companyId!,
            userId: req.user!.id,
          },
        });

        // Audit log the creation
        await auditLogger.log({
          action: 'interaction.create',
          userId: req.user!.id,
          companyId: req.companyId!,
          resourceType: 'interaction',
          resourceId: interaction.id,
          details: {
            interactionType: interaction.type,
            contactId: interaction.contactId,
            dealId: interaction.dealId,
          },
        });

        return successResponse(res, interaction, {
          statusCode: 201,
          requestId: req.id,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
