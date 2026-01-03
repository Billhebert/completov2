import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupTechniciansLocationRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/technicians/:id/location`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tech = await prisma.fieldTechnician.update({
        where: { id: req.params.id, companyId: req.companyId! },
        data: { location: req.body.location },
      });
      res.json({ success: true, data: tech });
    } catch (error) { next(error); }
  });
}
