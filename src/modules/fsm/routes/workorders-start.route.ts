import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupWorkordersStartRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/start`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const order = await prisma.workOrder.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: { status: 'in_progress', actualStart: new Date() },
      });
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  });
}
