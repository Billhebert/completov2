/**
 * CRM - Contacts Create Route
 * POST /api/v1/crm/contacts
 * Create a new contact
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission, validateBody } from '../../../../core/middleware';
import { z } from 'zod';

// Contact validation schema
const contactSchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  crmCompanyId: z.string().uuid().optional(),
  position: z.string().optional(),
  website: z.string().url().optional(),
  tags: z.array(z.string()).optional(),
  ownerId: z.string().optional(),
});

export function setupContactsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(
    `${baseUrl}/contacts`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    validateBody(contactSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { companyId, userId } = req as any;

        // Normalize email
        const email = String(req.body.email || '')
          .trim()
          .toLowerCase();

        const contact = await prisma.contact.create({
          data: {
            ...req.body,
            email,
            companyId,
            ownerId: userId,
          },
        });

        return res.status(201).json({ data: contact });
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
