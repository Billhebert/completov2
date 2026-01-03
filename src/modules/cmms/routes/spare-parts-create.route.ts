import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { requirePermission } from '../../rbac/middleware';

export function setupSparePartsCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/spare-parts`,
    authenticate,
    tenantIsolation,
    requirePermission('inventory', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { partNumber, name, description, category, manufacturer, supplier, unitCost, quantityOnHand, minQuantity, maxQuantity, location } = req.body;
        
        const part = await prisma.sparePart.create({
          data: {
            companyId: req.companyId!,
            partNumber,
            name,
            description,
            category,
            manufacturer,
            supplier,
            unitCost,
            quantityOnHand: quantityOnHand || 0,
            minQuantity: minQuantity || 0,
            maxQuantity,
            location,
          },
        });
        res.json({ success: true, data: part });
      } catch (error) {
        next(error);
      }
    }
  );
}
