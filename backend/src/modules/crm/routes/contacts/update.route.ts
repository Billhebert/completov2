/**
 * CRM - Contacts Update Route
 * PATCH /api/v1/crm/contacts/:id
 * Update an existing contact
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupContactsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(
    `${baseUrl}/contacts/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_CREATE),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const contact = await prisma.contact.update({
          where: { id: req.params.id },
          data: req.body,
        });

        res.json({ success: true, data: contact });
      } catch (error) {
        next(error);
      }
    }
  );
}
