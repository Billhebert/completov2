import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { setupNarrativeGenerateRoute } from './generate.route';

export function setupNarrativeRoutes(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string = '/api/v1/narrative'
) {
  setupNarrativeGenerateRoute(app, prisma, baseUrl);
}
