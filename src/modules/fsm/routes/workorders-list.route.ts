import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupWorkordersListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/workorders`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, technicianId, priority } = req.query;
      const where: any = { companyId: req.companyId! };
      if (status) where.status = status;
      if (technicianId) where.technicianId = technicianId;
      if (priority) where.priority = priority;

      const orders = await prisma.workOrder.findMany({
        where,
        include: { technician: { select: { userId: true, status: true } }, _count: { select: { tasks: true, checklistItems: true } } },
        orderBy: [{ priority: 'desc' }, { scheduledStart: 'asc' }],
      });
      res.json({ success: true, data: orders });
    } catch (error) { next(error); }
  });
}
