import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupSyncRunsListRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/runs`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const runs = await prisma.syncRun.findMany({
          where: { companyId: req.companyId! },
          orderBy: { startedAt: 'desc' },
          take: 50,
        });
        res.json({ success: true, data: runs });
      } catch (error) {
        next(error);
      }
    }
  );
}
