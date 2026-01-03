import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMaintenancePlansListRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/maintenance-plans`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const plans = await prisma.assetMaintenancePlan.findMany({
          where: { companyId: req.companyId!, isActive: true },
          include: { asset: { select: { id: true, name: true, assetTag: true } } },
          orderBy: { nextDue: 'asc' },
        });
        res.json({ success: true, data: plans });
      } catch (error) {
        next(error);
      }
    }
  );
}
