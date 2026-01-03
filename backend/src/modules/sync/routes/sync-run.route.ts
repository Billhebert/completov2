import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { enqueueSyncJob } from '../../../core/queues';
import { z } from 'zod';

const syncSchema = z.object({
  provider: z.string(),
  entityType: z.string(),
  direction: z.enum(['pull', 'push']),
});

export function setupSyncRunRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/run`,
    authenticate,
    tenantIsolation,
    validateBody(syncSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { provider, entityType, direction } = req.body;

        const job = await enqueueSyncJob({
          companyId: req.companyId!,
          provider,
          entityType,
          direction,
        });

        res.json({
          success: true,
          data: { jobId: job.id, message: 'Sync job enqueued' },
        });
      } catch (error) {
        next(error);
      }
    }
  );
}
