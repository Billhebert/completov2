import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupWorkorderTasksRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workorders/:id/tasks`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await prisma.workOrderTask.create({
        data: { workOrderId: req.params.id, title: req.body.title, description: req.body.description, order: req.body.order || 0 },
      });
      res.json({ success: true, data: task });
    } catch (error) { next(error); }
  });
}
