import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupSparePartsLowStockRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/spare-parts/low-stock`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const parts = await prisma.sparePart.findMany({
          where: {
            companyId: req.companyId!,
            quantityOnHand: {
              lte: prisma.sparePart.fields.minQuantity,
            },
          },
          orderBy: { quantityOnHand: 'asc' },
        });
        res.json({ success: true, data: parts });
      } catch (error) {
        next(error);
      }
    }
  );
}
