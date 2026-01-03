import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { requirePermission } from '../../rbac/middleware';

export function setupAssetsUpdateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.patch(
    `${baseUrl}/assets/:id`,
    authenticate,
    tenantIsolation,
    requirePermission('asset', 'update'),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const asset = await prisma.asset.update({
          where: { id: req.params.id },
          data: req.body,
        });
        res.json({ success: true, data: asset });
      } catch (error) {
        next(error);
      }
    }
  );
}
