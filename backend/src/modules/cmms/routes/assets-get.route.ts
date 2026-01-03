import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupAssetsGetRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/assets/:id`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const asset = await prisma.asset.findFirst({
          where: { id: req.params.id, companyId: req.companyId! },
          include: {
            parentAsset: true,
            childAssets: true,
            maintenancePlans: { where: { isActive: true } },
            maintenanceHistory: { orderBy: { startTime: 'desc' }, take: 10 },
            meters: true,
          },
        });
        res.json({ success: true, data: asset });
      } catch (error) {
        next(error);
      }
    }
  );
}
