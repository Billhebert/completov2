import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupAssetsListRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/assets`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { category, status } = req.query;
        const where: any = { companyId: req.companyId! };
        if (category) where.category = category;
        if (status) where.status = status;

        const assets = await prisma.asset.findMany({
          where,
          include: {
            _count: {
              select: {
                maintenancePlans: true,
                maintenanceHistory: true,
                childAssets: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });
        res.json({ success: true, data: assets });
      } catch (error) {
        next(error);
      }
    }
  );
}
