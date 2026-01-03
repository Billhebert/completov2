// src/core/errors/index.ts

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }

  toJSON() {
    return {
      code: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

// 400 Bad Request
export class BadRequestError extends AppError {
  constructor(message: string, details?: any) {
    super(400, 'BAD_REQUEST', message, details);
    this.name = 'BadRequestError';
  }
}

// 401 Unauthorized
export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, 'UNAUTHORIZED', message);
    this.name = 'UnauthorizedError';
  }
}

// 403 Forbidden
export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, 'FORBIDDEN', message);
    this.name = 'ForbiddenError';
  }
}

// 404 Not Found
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(404, 'NOT_FOUND', `${resource} not found`);
    this.name = 'NotFoundError';
  }
}

// 409 Conflict
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, 'CONFLICT', message, details);
    this.name = 'ConflictError';
  }
}

// 422 Unprocessable Entity (Validation)
export class ValidationError extends AppError {
  constructor(details: any) {
    super(422, 'VALIDATION_ERROR', 'Validation failed', details);
    this.name = 'ValidationError';
  }
}

// 429 Too Many Requests
export class TooManyRequestsError extends AppError {
  constructor(message: string = 'Too many requests') {
    super(429, 'TOO_MANY_REQUESTS', message);
    this.name = 'TooManyRequestsError';
  }
}

// 500 Internal Server Error
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', details?: any) {
    super(500, 'INTERNAL_SERVER_ERROR', message, details);
    this.name = 'InternalServerError';
  }
}

// 503 Service Unavailable
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(503, 'SERVICE_UNAVAILABLE', `${service} is currently unavailable`);
    this.name = 'ServiceUnavailableError';
  }
}
