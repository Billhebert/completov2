import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupDowntimeCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/downtime`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { assetId, reason, description, impact, cost } = req.body;
        
        const downtime = await prisma.assetDowntime.create({
          data: {
            companyId: req.companyId!,
            assetId,
            reason,
            description,
            startTime: new Date(),
            impact,
            cost,
          },
        });
        
        await prisma.asset.update({
          where: { id: assetId },
          data: { status: 'down' },
        });
        
        res.json({ success: true, data: downtime });
      } catch (error) {
        next(error);
      }
    }
  );
}
