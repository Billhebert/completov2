import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupEnrollRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/paths/:id/enroll`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollment = await prisma.learningEnrollment.create({
        data: { userId: req.user!.id, pathId: req.params.id, status: 'enrolled', progress: 0 },
      });
      res.status(201).json({ success: true, data: enrollment });
    } catch (error) { next(error); }
  });
}
