import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupEnrollmentsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/enrollments`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollments = await prisma.learningEnrollment.findMany({
        where: { userId: req.user!.id },
        include: { path: { include: { _count: { select: { items: true } } } } },
        orderBy: { enrolledAt: 'desc' },
      });
      res.json({ success: true, data: enrollments });
    } catch (error) { next(error); }
  });
}
