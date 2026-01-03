import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, adminOnly } from '../../../core/middleware';
import { DeduplicationAgent } from '../agent.service';

export function setupDeduplicationAutoMergeRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const agent = new DeduplicationAgent(prisma);

  app.post(`${baseUrl}/auto-merge`, authenticate, tenantIsolation, adminOnly, async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Detectar duplicatas com alta confiança (>95%)
      const groups = await agent.detectDuplicates('contact', req.companyId!, 0.95);

      let mergedCount = 0;

      for (const group of groups) {
        if (group.length >= 2) {
          const primary = group[0].primary;
          const duplicates = group.slice(1).map(g => g.duplicate.id);

          await agent.mergeDuplicates(req.companyId!, primary.id, duplicates, 'contact');
          mergedCount += duplicates.length;
        }
      }

      res.json({
        success: true,
        data: {
          groups: groups.length,
          mergedCount,
        },
      });
    } catch (error) {
      next(error);
    }
  });
}
