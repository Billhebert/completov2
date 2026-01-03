import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupWorkordersCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { title, description, type, priority, customerId, assetId, technicianId, scheduledStart, scheduledEnd, location, instructions, partsRequired } = req.body;
      const order = await prisma.workOrder.create({
        data: {
          companyId: req.companyId!, title, description, type, priority: priority || 'medium', customerId, assetId, technicianId,
          scheduledStart: scheduledStart ? new Date(scheduledStart) : null,
          scheduledEnd: scheduledEnd ? new Date(scheduledEnd) : null,
          location: location || {}, instructions, partsRequired, createdBy: req.user!.id,
        },
      });
      res.json({ success: true, data: order });
    } catch (error) { next(error); }
  });
}
