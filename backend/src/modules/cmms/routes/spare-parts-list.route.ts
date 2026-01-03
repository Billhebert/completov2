import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupSparePartsListRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/spare-parts`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parts = await prisma.sparePart.findMany({
          where: { companyId: req.companyId! },
          orderBy: { name: 'asc' },
        });
        res.json({ success: true, data: parts });
      } catch (error) {
        next(error);
      }
    }
  );
}
