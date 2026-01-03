/**
 * CRM - Contacts List Route
 * GET /api/v1/crm/contacts
 * List all contacts with filters, pagination, and sorting
 *
 * Features:
 * - Standardized pagination (limit, offset, or page-based)
 * - Soft delete filtering (excludes deleted contacts)
 * - Full-text search across name, email, company
 * - Tag, status, and owner filtering
 * - Sortable by multiple fields
 */

import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, requirePermission, Permission } from '../../../../core/middleware';
import { notDeleted } from '../../../../core/utils/soft-delete';
import {
  parsePaginationParams,
  parseSortingParams,
  createPaginatedResponse,
  getPrismaPagination,
  createPrismaOrderBy,
} from '../../../../core/utils/pagination';
import { successResponse } from '../../../../core/utils/api-response';

// Allowed sort fields for contacts
const ALLOWED_SORT_FIELDS = [
  'name',
  'email',
  'createdAt',
  'updatedAt',
  'lastContactedAt',
  'leadScore',
];

export function setupContactsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/contacts`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { search, tag, leadStatus, ownerId, includeDeleted } = req.query;

        // Parse pagination and sorting
        const paginationParams = parsePaginationParams(req.query);
        const sortingParams = parseSortingParams(req.query, ALLOWED_SORT_FIELDS);

        // Build where clause
        const where: any = {
          companyId: req.companyId!,
          // Exclude soft-deleted contacts unless explicitly requested
          ...(includeDeleted !== 'true' ? notDeleted : {}),
        };

        // Search filter (full-text search)
        if (search && typeof search === 'string') {
          where.OR = [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
            { companyName: { contains: search, mode: 'insensitive' } },
          ];
        }

        // Tag filter
        if (tag && typeof tag === 'string') {
          where.tags = { has: tag };
        }

        // Lead status filter
        if (leadStatus && typeof leadStatus === 'string') {
          where.leadStatus = leadStatus;
        }

        // Owner filter
        if (ownerId && typeof ownerId === 'string') {
          where.ownerId = ownerId;
        }

        // Execute queries in parallel
        const [contacts, total] = await Promise.all([
          prisma.contact.findMany({
            where,
            ...getPrismaPagination(paginationParams),
            include: {
              owner: { select: { id: true, name: true, email: true } },
              crmCompany: { select: { id: true, name: true, status: true } },
              _count: { select: { deals: true, interactions: true } },
            },
            orderBy: createPrismaOrderBy(sortingParams, 'createdAt'),
          }),
          prisma.contact.count({ where }),
        ]);

        // Create paginated response
        const response = createPaginatedResponse(contacts, total, paginationParams);

        return successResponse(res, response.data, {
          meta: response.meta,
          requestId: req.id,
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
