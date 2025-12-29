// src/core/middleware/error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../errors';
import { logger } from '../logger';
import { env } from '../config/env';

/**
 * Global error handler middleware
 */
export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  // Generate trace ID if not exists
  const traceId = req.traceId || generateTraceId();

  // Log error
  logger.error({
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
    traceId,
    method: req.method,
    url: req.url,
    user: req.user?.id,
    companyId: req.companyId,
  }, 'Request error');

  // Handle known app errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        ...(error.details && { details: error.details }),
        traceId,
      },
    });
  }

  // Handle unknown errors
  const isDevelopment = env.NODE_ENV === 'development';
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      ...(isDevelopment && { stack: error.stack }),
      traceId,
    },
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

function generateTraceId(): string {
  return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
