import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupTimeTrackingStartRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/time`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const entry = await prisma.workOrderTimeEntry.create({
        data: { workOrderId: req.params.id, technicianId: req.user!.id, startTime: new Date(), description: req.body.description },
      });
      res.json({ success: true, data: entry });
    } catch (error) { next(error); }
  });
}
