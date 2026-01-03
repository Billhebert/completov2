/**
 * CRM - Contacts Create Route
 * POST /api/v1/crm/contacts
 * Create a new contact
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { createContactSchema } from '../../schemas/contact.schema';
import { auditLogger } from '../../../../core/audit/audit-logger';
import { successResponse } from '../../../../core/utils/api-response';

export function setupContactsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(
    `${baseUrl}/contacts`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(createContactSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { companyId, userId } = req as any;
        const validatedData = req.body; // Already validated by schema

        // Normalize email
        const email = validatedData.email
          ? String(validatedData.email).trim().toLowerCase()
          : undefined;

        // Only include validated fields from schema
        const contact = await prisma.contact.create({
          data: {
            name: validatedData.name,
            email,
            phone: validatedData.phone,
            companyName: validatedData.companyName,
            position: validatedData.position,
            tags: validatedData.tags,
            status: validatedData.status || 'lead',
            source: validatedData.source,
            notes: validatedData.notes,
            customFields: validatedData.customFields,
            companyId,
            ownerId: userId,
          },
        });

        // Audit log the creation
        await auditLogger.log({
          action: 'contact.create',
          userId,
          companyId,
          resourceType: 'contact',
          resourceId: contact.id,
          details: {
            contactName: contact.name,
            contactEmail: contact.email,
          },
        });

        return successResponse(res, contact, {
          statusCode: 201,
          requestId: req.id
        });
      } catch (err: any) {
        // Handle unique constraint violation (duplicate email)
        if (
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002'
        ) {
          const targets = (err.meta as any)?.target as string[] | undefined;
          const isEmailConflict =
            Array.isArray(targets) && targets.includes('email');

          return res.status(409).json({
            code: 'CONTACT_EMAIL_ALREADY_EXISTS',
            message: isEmailConflict
              ? 'Já existe um contato com esse email nesta empresa.'
              : 'Já existe um registro com dados duplicados.',
          });
        }

        return next(err);
      }
    }
  );
}
