import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupItemCompleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/items/:itemId/complete`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const progress = await prisma.learningProgress.upsert({
        where: { userId_itemId: { userId: req.user!.id, itemId: req.params.itemId } },
        create: { userId: req.user!.id, itemId: req.params.itemId, status: 'completed', completedAt: new Date() },
        update: { status: 'completed', completedAt: new Date() },
      });

      const item = await prisma.learningPathItem.findUnique({ where: { id: req.params.itemId } });
      if (item) {
        const enrollment = await prisma.learningEnrollment.findUnique({
          where: { userId_pathId: { userId: req.user!.id, pathId: item.pathId } },
        });

        if (enrollment) {
          const totalItems = await prisma.learningPathItem.count({ where: { pathId: item.pathId } });
          const completedItems = await prisma.learningProgress.count({
            where: { userId: req.user!.id, status: 'completed', item: { pathId: item.pathId } },
          });
          const newProgress = (completedItems / totalItems) * 100;

          await prisma.learningEnrollment.update({
            where: { id: enrollment.id },
            data: { progress: newProgress, status: newProgress >= 100 ? 'completed' : 'in_progress', completedAt: newProgress >= 100 ? new Date() : null },
          });
        }
      }

      res.json({ success: true, data: progress });
    } catch (error) { next(error); }
  });
}
