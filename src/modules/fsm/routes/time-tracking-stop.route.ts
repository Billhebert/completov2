import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupTimeTrackingStopRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/time/:id/stop`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entry = await prisma.workOrderTimeEntry.findUnique({ where: { id: req.params.id } });
      if (!entry) return res.status(404).json({ success: false });
      const duration = Math.floor((Date.now() - entry.startTime.getTime()) / 60000);
      const updated = await prisma.workOrderTimeEntry.update({
        where: { id: req.params.id },
        data: { endTime: new Date(), duration },
      });
      res.json({ success: true, data: updated });
    } catch (error) { next(error); }
  });
}
