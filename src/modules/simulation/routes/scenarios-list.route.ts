import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupScenariosListRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/scenarios`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { companyId } = req.user!;
        const { type } = req.query;

        const where: any = { companyId, isActive: true };
        if (type) where.type = type;

        const scenarios = await prisma.simulationScenario.findMany({
          where,
          orderBy: { createdAt: 'desc' }
        });

        res.json({ data: scenarios });
      } catch (error: any) {
        logger.error({ error }, 'Error listing scenarios');
        next(error);
      }
    }
  );
}
