/**
 * CRM - Contacts List Route
 * GET /api/v1/crm/contacts
 * List all contacts with filters and pagination
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';

export function setupContactsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/contacts`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const {
          search,
          tag,
          leadStatus,
          ownerId,
          page = '1',
          limit = '20',
        } = req.query;

        const where: any = { companyId: req.companyId! };

        // Search filter
        if (search) {
          where.OR = [
            { name: { contains: search as string, mode: 'insensitive' } },
            { email: { contains: search as string, mode: 'insensitive' } },
            { companyName: { contains: search as string, mode: 'insensitive' } },
          ];
        }

        // Tag filter
        if (tag) where.tags = { has: tag as string };

        // Lead status filter
        if (leadStatus) where.leadStatus = leadStatus;

        // Owner filter
        if (ownerId) where.ownerId = ownerId;

        // Pagination
        const skip = (parseInt(page as string) - 1) * parseInt(limit as string);

        const [contacts, total] = await Promise.all([
          prisma.contact.findMany({
            where,
            skip,
            take: parseInt(limit as string),
            include: {
              owner: { select: { id: true, name: true, email: true } },
              crmCompany: { select: { id: true, name: true, status: true } },
              _count: { select: { deals: true, interactions: true } },
            },
            orderBy: { createdAt: 'desc' },
          }),
          prisma.contact.count({ where }),
        ]);

        res.json({
          success: true,
          data: contacts,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            pages: Math.ceil(total / parseInt(limit as string)),
          },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
