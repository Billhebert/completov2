import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { requirePermission } from '../../rbac/middleware';

export function setupAssetsCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/assets`,
    authenticate,
    tenantIsolation,
    requirePermission('asset', 'create'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { name, assetTag, category, type, manufacturer, model, serialNumber, purchaseDate, purchaseCost, location, specifications, parentAssetId } = req.body;
        
        const asset = await prisma.asset.create({
          data: {
            companyId: req.companyId!,
            name,
            assetTag,
            category,
            type,
            manufacturer,
            model,
            serialNumber,
            purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
            purchaseCost,
            location,
            specifications,
            parentAssetId,
            createdBy: req.user!.id,
          },
        });
        res.json({ success: true, data: asset });
      } catch (error) {
        next(error);
      }
    }
  );
}
