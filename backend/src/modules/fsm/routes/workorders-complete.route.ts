import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupWorkordersCompleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/complete`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { signature, feedback } = req.body;
      const order = await prisma.workOrder.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: { status: 'completed', actualEnd: new Date(), signature, feedback },
      });
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  });
}
