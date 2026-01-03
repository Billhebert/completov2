import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupDevelopmentPlansRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/development-plans`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const plans = await prisma.skillDevelopmentPlan.findMany({
        where: { companyId: req.companyId!, userId: req.user!.id },
      });
      res.json({ success: true, data: plans });
    } catch (error) { next(error); }
  });
}
