import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/dashboard';

  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export default setupRoutes;
