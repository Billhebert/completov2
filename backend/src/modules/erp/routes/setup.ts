import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { setupProductsListRoute, setupProductsCreateRoute } from './index';

export function setupErpRoutes(app: Express, prisma: PrismaClient, baseUrl: string = '/api/v1/erp') {
  setupProductsListRoute(app, prisma, baseUrl);
  setupProductsCreateRoute(app, prisma, baseUrl);
}
