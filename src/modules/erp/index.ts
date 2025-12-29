import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../core/middleware';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/erp';
  app.get(`${base}/products`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const products = await prisma.product.findMany({ where: { companyId: req.companyId! }, take: 100 });
      res.json({ success: true, data: products });
    } catch (error) { next(error); }
  });
  app.post(`${base}/products`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const product = await prisma.product.create({ data: { ...req.body, companyId: req.companyId! } });
      res.status(201).json({ success: true, data: product });
    } catch (error) { next(error); }
  });
}
export const erpModule: ModuleDefinition = { name: 'erp', version: '1.0.0', provides: ['erp'], routes: (ctx) => setupRoutes(ctx.app, ctx.prisma) };
