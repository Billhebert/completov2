import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupChecklistRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/checklist`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await prisma.workOrderChecklist.create({
        data: { workOrderId: req.params.id, item: req.body.item, order: req.body.order || 0 },
      });
      res.json({ success: true, data: item });
    } catch (error) { next(error); }
  });
}
