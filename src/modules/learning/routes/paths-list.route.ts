import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupPathsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/paths`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { category, difficulty } = req.query;
      const where: any = { companyId: req.companyId! };
      if (category) where.category = category;
      if (difficulty) where.difficulty = difficulty;

      const paths = await prisma.learningPath.findMany({
        where,
        include: { _count: { select: { items: true, enrollments: true } } },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: paths });
    } catch (error) { next(error); }
  });
}
