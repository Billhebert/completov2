import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupProductsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/products`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const products = await prisma.product.findMany({ where: { companyId: req.companyId! }, take: 100 });
      res.json({ success: true, data: products });
    } catch (error) { next(error); }
  });
}
