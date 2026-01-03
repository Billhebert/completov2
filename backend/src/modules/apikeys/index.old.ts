// src/modules/apikeys/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../core/middleware';
import crypto from 'crypto';
import { z } from 'zod';

const createApiKeySchema = z.object({
  name: z.string().min(1),
  scopes: z.array(z.string()),
  expiresAt: z.string().datetime().optional(),
});

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/apikeys';

  // List API keys
  app.get(`${base}`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const apiKeys = await prisma.apiKey.findMany({
        where: { companyId: req.companyId! },
        select: {
          id: true,
          name: true,
          prefix: true,
          scopes: true,
          lastUsedAt: true,
          expiresAt: true,
          revoked: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json({ success: true, data: apiKeys });
    } catch (error) {
      next(error);
    }
  });

  // Create API key
  app.post(
    `${base}`,
    authenticate,
    tenantIsolation,
    validateBody(createApiKeySchema),
    async (req, res, next) => {
      try {
        // Generate API key
        const randomBytes = crypto.randomBytes(32);
        const key = `omni_${randomBytes.toString('base64url')}`;
        const hashedKey = crypto.createHash('sha256').update(key).digest('hex');
        const prefix = key.substring(0, 12);

        const apiKey = await prisma.apiKey.create({
          data: {
            companyId: req.companyId!,
            createdById: req.user!.id,
            name: req.body.name,
            keyHash: hashedKey,
            prefix,
            scopes: req.body.scopes,
            expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
          },
        });

        // Return the key only once (it won't be stored in plain text)
        res.status(201).json({
          success: true,
          data: {
            ...apiKey,
            key, // Only shown once!
          },
          warning: 'Save this key now. You will not be able to see it again.',
        });
      } catch (error) {
        next(error);
      }
    }
  );

  // Revoke API key
  app.post(`${base}/:id/revoke`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      await prisma.apiKey.update({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
        data: { revoked: true },
      });

      res.json({ success: true, message: 'API key revoked' });
    } catch (error) {
      next(error);
    }
  });

  // Delete API key
  app.delete(`${base}/:id`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      await prisma.apiKey.delete({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
      });

      res.json({ success: true, message: 'API key deleted' });
    } catch (error) {
      next(error);
    }
  });

  // Get API key usage stats
  app.get(`${base}/:id/usage`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const apiKey = await prisma.apiKey.findFirst({
        where: {
          id: req.params.id,
          companyId: req.companyId!,
        },
        include: {
          _count: {
            select: { usageLogs: true },
          },
        },
      });

      if (!apiKey) {
        return res.status(404).json({
          success: false,
          error: { message: 'API key not found' },
        });
      }

      const recentLogs = await prisma.apiKeyUsageLog.findMany({
        where: { apiKeyId: apiKey.id },
        orderBy: { timestamp: 'desc' },
        take: 100,
      });

      res.json({
        success: true,
        data: {
          totalRequests: apiKey._count.usageLogs,
          lastUsedAt: apiKey.lastUsedAt,
          recentLogs,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}

export const apikeysModule: ModuleDefinition = {
  name: 'apikeys',
  version: '1.0.0',
  provides: ['api-keys', 'm2m-auth'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
