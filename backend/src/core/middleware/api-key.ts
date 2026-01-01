// src/core/middleware/api-key.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { UnauthorizedError } from '../errors';

const prisma = new PrismaClient();

export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      return next(new UnauthorizedError('API key required'));
    }

    // Hash the provided key
    const hashedKey = crypto.createHash('sha256').update(apiKey).digest('hex');

    // Find API key
    const key = await prisma.apiKey.findFirst({
      where: {
        keyHash: hashedKey,
        revoked: false,
      },
      include: {
        company: true,
      },
    });

    if (!key) {
      return next(new UnauthorizedError('Invalid API key'));
    }

    // Check expiration
    if (key.expiresAt && key.expiresAt < new Date()) {
      return next(new UnauthorizedError('API key expired'));
    }

    // Update last used
    await prisma.apiKey.update({
      where: { id: key.id },
      data: { lastUsedAt: new Date() },
    });

    // Log usage
    await prisma.apiKeyUsageLog.create({
      data: {
        apiKeyId: key.id,
        endpoint: req.path,
        method: req.method,
        ipAddress: req.ip || 'unknown',
        userAgent: req.headers['user-agent'] || 'unknown',
      },
    });

    // Set company context
    req.companyId = key.companyId;
    req.apiKeyScopes = key.scopes;

    next();
  } catch (error) {
    next(error);
  }
}

export function requireScope(scope: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.apiKeyScopes || !req.apiKeyScopes.includes(scope)) {
      return next(new UnauthorizedError(`Scope '${scope}' required`));
    }
    next();
  };
}
