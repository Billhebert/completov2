// src/core/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UnauthorizedError } from '../errors';
import { JWTPayload, AuthenticatedUser } from '../types';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      companyId?: string;
      traceId?: string;
      log?: any;
    }
  }
}

/**
 * JWT Authentication Middleware
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

      req.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.email.split('@')[0], // Fallback
        role: payload.role,
        companyId: payload.companyId,
      };

      req.companyId = payload.companyId;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw error;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication (doesn't fail if no token)
 */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);

    try {
      const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

      req.user = {
        id: payload.userId,
        email: payload.email,
        name: payload.email.split('@')[0],
        role: payload.role,
        companyId: payload.companyId,
      };

      req.companyId = payload.companyId;
    } catch {
      // Ignore errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Generate refresh token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  };
  return jwt.sign(payload, env.JWT_SECRET, options);
}

/**
 * Verify refresh token
 */
export function verifyRefreshToken(token: string): JWTPayload {
  return jwt.verify(token, env.JWT_SECRET) as JWTPayload;
}
