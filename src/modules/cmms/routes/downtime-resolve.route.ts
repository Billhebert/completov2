import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupDowntimeResolveRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.patch(
    `${baseUrl}/downtime/:id/resolve`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const downtime = await prisma.assetDowntime.findUnique({ where: { id: req.params.id } });
        if (!downtime) {
          return res.status(404).json({ success: false });
        }
        
        const duration = Math.floor((Date.now() - downtime.startTime.getTime()) / 60000);
        
        const updated = await prisma.assetDowntime.update({
          where: { id: req.params.id },
          data: {
            endTime: new Date(),
            duration,
            resolvedBy: req.user!.id,
          },
        });
        
        await prisma.asset.update({
          where: { id: downtime.assetId },
          data: { status: 'operational' },
        });
        
        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );
}
