// Zettels module - thin wrapper around knowledge nodes for compatibility
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import * as routes from './routes';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/zettels';

  Object.values(routes).forEach(fn => fn(app, prisma, base));
}

export default setupRoutes;
