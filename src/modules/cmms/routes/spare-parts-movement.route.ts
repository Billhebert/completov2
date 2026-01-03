import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupSparePartsMovementRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/spare-parts/:id/movement`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { type, quantity, reason, reference, notes } = req.body;
        
        const movement = await prisma.sparePartMovement.create({
          data: {
            companyId: req.companyId!,
            partId: req.params.id,
            type,
            quantity,
            reason,
            reference,
            performedBy: req.user!.id,
            notes,
          },
        });
        
        const part = await prisma.sparePart.findUnique({ where: { id: req.params.id } });
        if (part) {
          const delta = type === 'in' ? quantity : -quantity;
          await prisma.sparePart.update({
            where: { id: req.params.id },
            data: { quantityOnHand: part.quantityOnHand + delta },
          });
        }
        
        res.json({ success: true, data: movement });
      } catch (error) {
        next(error);
      }
    }
  );
}
