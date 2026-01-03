import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { DeduplicationAgent } from '../agent.service';
import { z } from 'zod';

const mergeSchema = z.object({
  primaryId: z.string(),
  duplicateIds: z.array(z.string()),
  entityType: z.enum(['contact', 'deal', 'company']),
});

export function setupDeduplicationMergeRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const agent = new DeduplicationAgent(prisma);

  app.post(`${baseUrl}/merge`, authenticate, tenantIsolation, validateBody(mergeSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { primaryId, duplicateIds, entityType } = req.body;

      const result = await agent.mergeDuplicates(
        req.companyId!,
        primaryId,
        duplicateIds,
        entityType as any
      );

      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  });
}
