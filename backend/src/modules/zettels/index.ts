// Zettels module - thin wrapper around knowledge nodes for compatibility
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/zettels';
  // Routes will be added here
}

export default setupRoutes;
