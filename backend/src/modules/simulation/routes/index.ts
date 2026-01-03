import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { setupScenariosListRoute } from './scenarios-list.route';
import { setupScenariosCreateRoute } from './scenarios-create.route';
import { setupSessionStartRoute } from './session-start.route';
import { setupSessionEndRoute } from './session-end.route';

export function setupSimulationRoutes(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string = '/api/v1/simulation'
) {
  setupScenariosListRoute(app, prisma, baseUrl);
  setupScenariosCreateRoute(app, prisma, baseUrl);
  setupSessionStartRoute(app, prisma, baseUrl);
  setupSessionEndRoute(app, prisma, baseUrl);
}
