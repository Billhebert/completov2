import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { DeduplicationAgent } from '../agent.service';
import { z } from 'zod';

const detectSchema = z.object({
  entityType: z.enum(['contact', 'deal', 'company']),
  minSimilarity: z.number().min(0).max(1).optional(),
});

export function setupDeduplicationDetectRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const agent = new DeduplicationAgent(prisma);

  app.post(`${baseUrl}/detect`, authenticate, tenantIsolation, validateBody(detectSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { entityType, minSimilarity } = req.body;

      const groups = await agent.detectDuplicates(
        entityType,
        req.companyId!,
        minSimilarity || 0.85
      );

      res.json({
        success: true,
        data: {
          totalGroups: groups.length,
          groups: groups.map(g => ({
            candidates: g.length,
            items: g,
          })),
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
