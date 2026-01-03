/**
 * CRM - Deals List Route
 * GET /api/v1/crm/deals
 * List all deals with filters, pagination, and sorting
 *
 * Features:
 * - Standardized pagination (limit, offset, or page-based)
 * - Soft delete filtering (excludes deleted deals)
 * - Stage, pipeline, and owner filtering
 * - Value range filtering (min/max)
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

// Allowed sort fields for deals
const ALLOWED_SORT_FIELDS = [
  'title',
  'value',
  'createdAt',
  'updatedAt',
  'expectedCloseDate',
  'closedDate',
  'probability',
];

export function setupDealsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(
    `${baseUrl}/deals`,
    authenticate,
    tenantIsolation,
    requirePermission(Permission.CONTACT_READ),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { stage, ownerId, pipelineId, stageId, minValue, maxValue, includeDeleted } = req.query;

        // Parse pagination and sorting
        const paginationParams = parsePaginationParams(req.query);
        const sortingParams = parseSortingParams(req.query, ALLOWED_SORT_FIELDS);

        // Build where clause
        const where: any = {
          companyId: req.companyId!,
          // Exclude soft-deleted deals unless explicitly requested
          ...(includeDeleted !== 'true' ? notDeleted : {}),
        };

        // Stage filter
        if (stage && typeof stage === 'string') {
          where.stage = stage;
        }

        // Owner filter
        if (ownerId && typeof ownerId === 'string') {
          where.ownerId = ownerId;
        }

        // Pipeline filter
        if (pipelineId && typeof pipelineId === 'string') {
          where.pipelineId = pipelineId;
        }

        // Stage reference filter
        if (stageId && typeof stageId === 'string') {
          where.stageId = stageId;
        }

        // Value range filter
        if (minValue || maxValue) {
          where.value = {};
          if (minValue) where.value.gte = parseFloat(minValue as string);
          if (maxValue) where.value.lte = parseFloat(maxValue as string);
        }

        // Execute queries in parallel
        const [deals, total] = await Promise.all([
          prisma.deal.findMany({
            where,
            ...getPrismaPagination(paginationParams),
            include: {
              contact: { select: { id: true, name: true, email: true } },
              owner: { select: { id: true, name: true, email: true } },
              products: true,
              pipeline: true,
              stageRef: true,
            },
            orderBy: createPrismaOrderBy(sortingParams, 'createdAt'),
          }),
          prisma.deal.count({ where }),
        ]);

        // Create paginated response
        const response = createPaginatedResponse(deals, total, paginationParams);

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
