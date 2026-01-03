import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupTechniciansCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/technicians`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId, skills, certifications, availability } = req.body;
      const tech = await prisma.fieldTechnician.create({
        data: { companyId: req.companyId!, userId, skills: skills || [], certifications, availability: availability || {} },
      });
      res.json({ success: true, data: tech });
    } catch (error) { next(error); }
  });
}
