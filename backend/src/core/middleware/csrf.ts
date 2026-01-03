// src/core/middleware/csrf.ts
import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { ForbiddenError } from '../errors';
import { env } from '../config/env';

/**
 * CSRF Token Storage
 * In production, use Redis for distributed systems
 */
class CSRFTokenStore {
  private tokens: Map<string, { token: string; expiresAt: number }> = new Map();

  generateToken(sessionId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    this.tokens.set(sessionId, { token, expiresAt });

    // Cleanup expired tokens periodically
    this.cleanup();

    return token;
  }

  validateToken(sessionId: string, token: string): boolean {
    const stored = this.tokens.get(sessionId);

    if (!stored) {
      return false;
    }

    if (Date.now() > stored.expiresAt) {
      this.tokens.delete(sessionId);
      return false;
    }

    return stored.token === token;
  }

  deleteToken(sessionId: string): void {
    this.tokens.delete(sessionId);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [sessionId, data] of this.tokens.entries()) {
      if (now > data.expiresAt) {
        this.tokens.delete(sessionId);
      }
    }
  }
}

const tokenStore = new CSRFTokenStore();

/**
 * Generate CSRF token for the current session
 * Attach token to response headers
 */
export function generateCSRFToken(req: Request, res: Response, next: NextFunction) {
  // Skip in test/development environments if configured
  if (env.NODE_ENV === 'test' || (env.NODE_ENV === 'development' && !env.CSRF_ENABLED)) {
    return next();
  }

  // Use user ID + session as unique identifier
  const sessionId = req.user?.id || req.ip || 'anonymous';
  const token = tokenStore.generateToken(sessionId);

  // Attach token to response header
  res.setHeader('X-CSRF-Token', token);

  // Also attach to request for potential use in templates
  (req as any).csrfToken = token;

  next();
}

/**
 * Validate CSRF token for state-changing operations
 * Should be applied to POST, PUT, PATCH, DELETE routes
 */
export function validateCSRFToken(req: Request, res: Response, next: NextFunction) {
  // Skip in test/development environments if configured
  if (env.NODE_ENV === 'test' || (env.NODE_ENV === 'development' && !env.CSRF_ENABLED)) {
    return next();
  }

  // Skip for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Get session identifier
  const sessionId = req.user?.id || req.ip || 'anonymous';

  // Get token from headers or body
  const token = req.headers['x-csrf-token'] || (req.body && req.body._csrf);

  if (!token || typeof token !== 'string') {
    throw new ForbiddenError('CSRF token missing');
  }

  // Validate token
  if (!tokenStore.validateToken(sessionId, token)) {
    throw new ForbiddenError('Invalid CSRF token');
  }

  next();
}

/**
 * CSRF protection for specific routes
 * Use this for state-changing operations
 */
export const csrfProtection = [generateCSRFToken, validateCSRFToken];

/**
 * Endpoint to get a fresh CSRF token
 */
export function setupCSRFTokenRoute(app: any, baseUrl: string = '/api/v1') {
  app.get(`${baseUrl}/csrf-token`, generateCSRFToken, (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        token: (req as any).csrfToken,
      },
    });
  });
}
