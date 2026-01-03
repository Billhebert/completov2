// src/core/utils/api-response.ts
import { Response } from 'express';

/**
 * Standard API Response Format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  meta?: {
    requestId?: string;
    timestamp: string;
    [key: string]: any;
  };
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

/**
 * Success response helper
 */
export function successResponse<T>(
  res: Response,
  data: T,
  meta?: Record<string, any>
): Response {
  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return res.json(response);
}

/**
 * Created response helper (201)
 */
export function createdResponse<T>(
  res: Response,
  data: T,
  location?: string,
  meta?: Record<string, any>
): Response {
  if (location) {
    res.setHeader('Location', location);
  }

  const response: ApiResponse<T> = {
    success: true,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return res.status(201).json(response);
}

/**
 * Paginated response helper
 */
export function paginatedResponse<T>(
  res: Response,
  data: T[],
  pagination: PaginationMeta,
  meta?: Record<string, any>
): Response {
  const { page, limit, total } = pagination;
  const totalPages = Math.ceil(total / limit);

  const response: ApiResponse<T[]> = {
    success: true,
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return res.json(response);
}

/**
 * No content response helper (204)
 */
export function noContentResponse(res: Response): Response {
  return res.status(204).send();
}

/**
 * Error response helper
 */
export function errorResponse(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, string[]>,
  meta?: Record<string, any>
): Response {
  const response: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
    meta: {
      timestamp: new Date().toISOString(),
      ...meta,
    },
  };

  return res.status(statusCode).json(response);
}

/**
 * Validation error response helper (400)
 */
export function validationErrorResponse(
  res: Response,
  details: Record<string, string[]>,
  meta?: Record<string, any>
): Response {
  return errorResponse(
    res,
    400,
    'VALIDATION_ERROR',
    'Validation failed',
    details,
    meta
  );
}

/**
 * Not found response helper (404)
 */
export function notFoundResponse(
  res: Response,
  message = 'Resource not found',
  meta?: Record<string, any>
): Response {
  return errorResponse(res, 404, 'RESOURCE_NOT_FOUND', message, undefined, meta);
}

/**
 * Unauthorized response helper (401)
 */
export function unauthorizedResponse(
  res: Response,
  message = 'Authentication required',
  code = 'UNAUTHORIZED',
  meta?: Record<string, any>
): Response {
  return errorResponse(res, 401, code, message, undefined, meta);
}

/**
 * Forbidden response helper (403)
 */
export function forbiddenResponse(
  res: Response,
  message = 'Access denied',
  code = 'FORBIDDEN',
  meta?: Record<string, any>
): Response {
  return errorResponse(res, 403, code, message, undefined, meta);
}

/**
 * Conflict response helper (409)
 */
export function conflictResponse(
  res: Response,
  message = 'Resource already exists',
  code = 'CONFLICT',
  meta?: Record<string, any>
): Response {
  return errorResponse(res, 409, code, message, undefined, meta);
}

/**
 * Rate limit response helper (429)
 */
export function rateLimitResponse(
  res: Response,
  retryAfter?: number,
  meta?: Record<string, any>
): Response {
  if (retryAfter) {
    res.setHeader('Retry-After', retryAfter.toString());
  }

  return errorResponse(
    res,
    429,
    'RATE_LIMIT_EXCEEDED',
    'Too many requests, please try again later',
    undefined,
    { retryAfter, ...meta }
  );
}

/**
 * Internal server error response helper (500)
 */
export function serverErrorResponse(
  res: Response,
  message = 'Internal server error',
  isDevelopment = false,
  stack?: string,
  meta?: Record<string, any>
): Response {
  return errorResponse(
    res,
    500,
    'INTERNAL_SERVER_ERROR',
    message,
    undefined,
    {
      ...(isDevelopment && stack && { stack }),
      ...meta,
    }
  );
}
