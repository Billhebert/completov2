import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupPathsGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/paths/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const path = await prisma.learningPath.findFirst({
        where: { id: req.params.id, companyId: req.companyId! },
        include: {
          items: { orderBy: { order: 'asc' } },
          enrollments: { where: { userId: req.user!.id }, include: { user: { select: { id: true, name: true } } } },
        },
      });
      if (!path) return res.status(404).json({ success: false, error: { message: 'Path not found' } });
      res.json({ success: true, data: path });
    } catch (error) { next(error); }
  });
}
