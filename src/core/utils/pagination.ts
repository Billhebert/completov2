// src/core/utils/pagination.ts
import { z } from 'zod';

/**
 * Standard pagination configuration
 */
export const PAGINATION_DEFAULTS = {
  DEFAULT_LIMIT: 50,
  MAX_LIMIT: 100,
  MIN_LIMIT: 1,
  DEFAULT_OFFSET: 0,
};

/**
 * Standard pagination query schema
 */
export const paginationSchema = z.object({
  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .pipe(
      z
        .number()
        .min(PAGINATION_DEFAULTS.MIN_LIMIT, `Limit must be at least ${PAGINATION_DEFAULTS.MIN_LIMIT}`)
        .max(PAGINATION_DEFAULTS.MAX_LIMIT, `Limit cannot exceed ${PAGINATION_DEFAULTS.MAX_LIMIT}`)
    )
    .default(String(PAGINATION_DEFAULTS.DEFAULT_LIMIT)),
  offset: z
    .string()
    .regex(/^\d+$/, 'Offset must be a number')
    .transform(Number)
    .pipe(z.number().min(0, 'Offset must be non-negative'))
    .optional()
    .default('0'),
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .pipe(z.number().min(1, 'Page must be at least 1'))
    .optional(),
});

/**
 * Pagination parameters
 */
export interface PaginationParams {
  limit: number;
  offset: number;
  page?: number;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  total: number;
  limit: number;
  offset: number;
  page?: number;
  totalPages?: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * Parse pagination parameters from query
 * Supports both offset-based and page-based pagination
 */
export function parsePaginationParams(query: any): PaginationParams {
  const validated = paginationSchema.parse(query);

  // If page is provided, calculate offset from page
  if (validated.page) {
    return {
      limit: validated.limit,
      offset: (validated.page - 1) * validated.limit,
      page: validated.page,
    };
  }

  return {
    limit: validated.limit,
    offset: validated.offset,
  };
}

/**
 * Calculate pagination metadata
 */
export function calculatePaginationMeta(
  total: number,
  params: PaginationParams
): PaginationMeta {
  const { limit, offset, page } = params;

  const meta: PaginationMeta = {
    total,
    limit,
    offset,
    hasMore: offset + limit < total,
    hasPrevious: offset > 0,
  };

  // If page-based pagination is used
  if (page !== undefined) {
    meta.page = page;
    meta.totalPages = Math.ceil(total / limit);
  }

  return meta;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResponse<T> {
  return {
    data,
    meta: calculatePaginationMeta(total, params),
  };
}

/**
 * Get Prisma pagination options from params
 */
export function getPrismaPagination(params: PaginationParams) {
  return {
    take: params.limit,
    skip: params.offset,
  };
}

/**
 * Sorting schema
 */
export const sortingSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

/**
 * Combined pagination and sorting schema
 */
export const paginationWithSortingSchema = paginationSchema.merge(sortingSchema);

/**
 * Parse sorting parameters
 */
export interface SortingParams {
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
}

export function parseSortingParams(
  query: any,
  allowedFields: string[] = []
): SortingParams {
  const validated = sortingSchema.parse(query);

  // Validate sortBy field if provided
  if (validated.sortBy && allowedFields.length > 0) {
    if (!allowedFields.includes(validated.sortBy)) {
      throw new Error(
        `Invalid sort field. Allowed fields: ${allowedFields.join(', ')}`
      );
    }
  }

  return {
    sortBy: validated.sortBy,
    sortOrder: validated.sortOrder,
  };
}

/**
 * Create Prisma orderBy from sorting params
 */
export function createPrismaOrderBy(
  params: SortingParams,
  defaultField: string = 'createdAt'
): Record<string, 'asc' | 'desc'> {
  const field = params.sortBy || defaultField;
  return { [field]: params.sortOrder };
}
