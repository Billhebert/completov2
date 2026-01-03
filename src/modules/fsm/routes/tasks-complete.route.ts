import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupTasksCompleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/tasks/:id/complete`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await prisma.workOrderTask.update({
        where: { id: req.params.id },
        data: { isCompleted: true, completedAt: new Date(), completedBy: req.user!.id },
      });
      res.json({ success: true, data: task });
    } catch (error) { next(error); }
  });
}
