/**
 * CRM - Contacts Get Route
 * GET /api/v1/crm/contacts/:id
 * Get a specific contact by ID
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupContactsGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/contacts/:id`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const contact = await prisma.contact.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            owner: { select: { id: true, name: true, email: true } },
            crmCompany: {
              select: { id: true, name: true, status: true, industry: true }
            },
            deals: {
              include: { owner: { select: { id: true, name: true } } },
              orderBy: { createdAt: 'desc' },
            },
            interactions: {
              include: { user: { select: { id: true, name: true } } },
              orderBy: { timestamp: 'desc' },
              take: 10,
            },
          },
        });

        if (!contact) {
          return res
            .status(404)
            .json({ success: false, error: { message: 'Contact not found' } });
        }

        res.json({ success: true, data: contact });
      } catch (error) {
        next(error);
      }
    }
  );
}
