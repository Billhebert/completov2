import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupTechniciansListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/technicians`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const techs = await prisma.fieldTechnician.findMany({
        where: { companyId: req.companyId!, isActive: true },
        select: { id: true, userId: true, skills: true, status: true, rating: true, location: true },
      });
      res.json({ success: true, data: techs });
    } catch (error) { next(error); }
  });
}
