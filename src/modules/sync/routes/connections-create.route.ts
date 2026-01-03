import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { z } from 'zod';

const createConnectionSchema = z.object({
  provider: z.enum(['rdstation', 'confirm8', 'pipefy', 'chatwoot']),
  apiKey: z.string(),
  config: z.record(z.any()).optional(),
});

export function setupConnectionsCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/connections`,
    authenticate,
    tenantIsolation,
    validateBody(createConnectionSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const connection = await prisma.integrationConnection.create({
          data: {
            companyId: req.companyId!,
            provider: req.body.provider,
            status: 'connected',
            authData: { apiKey: req.body.apiKey },
            config: req.body.config || {},
          },
        });
        res.status(201).json({ success: true, data: connection });
      } catch (error) {
        next(error);
      }
    }
  );
}
