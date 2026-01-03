import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupSyncRunsGetRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/runs/:runId`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const run = await prisma.syncRun.findFirst({
          where: {
            id: req.params.runId,
            companyId: req.companyId!,
          },
          include: {
            logs: {
              orderBy: { createdAt: 'desc' },
              take: 100,
            },
          },
        });

        if (!run) {
          return res.status(404).json({ success: false, error: { message: 'Run not found' } });
        }

        res.json({ success: true, data: run });
      } catch (error) {
        next(error);
      }
    }
  );
}
