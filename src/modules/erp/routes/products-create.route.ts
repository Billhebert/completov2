import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupProductsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/products`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const product = await prisma.product.create({ data: { ...req.body, companyId: req.companyId! } });
      res.status(201).json({ success: true, data: product });
    } catch (error) { next(error); }
  });
}
