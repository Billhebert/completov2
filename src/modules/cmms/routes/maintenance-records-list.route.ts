import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMaintenanceRecordsListRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/maintenance-records`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { assetId, type } = req.query;
        const where: any = { companyId: req.companyId! };
        if (assetId) where.assetId = assetId;
        if (type) where.type = type;

        const records = await prisma.maintenanceRecord.findMany({
          where,
          include: { asset: { select: { id: true, name: true, assetTag: true } } },
          orderBy: { startTime: 'desc' },
          take: 100,
        });
        res.json({ success: true, data: records });
      } catch (error) {
        next(error);
      }
    }
  );
}
