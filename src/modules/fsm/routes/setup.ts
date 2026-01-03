import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  setupTechniciansListRoute,
  setupTechniciansCreateRoute,
  setupTechniciansLocationRoute,
  setupWorkordersListRoute,
  setupWorkordersCreateRoute,
  setupWorkordersUpdateRoute,
  setupWorkordersStartRoute,
  setupWorkordersCompleteRoute,
  setupWorkorderTasksRoute,
  setupTasksCompleteRoute,
  setupChecklistRoute,
  setupTimeTrackingStartRoute,
  setupTimeTrackingStopRoute,
} from './index';

export function setupFsmRoutes(app: Express, prisma: PrismaClient, baseUrl: string = '/api/v1/fsm') {
  setupTechniciansListRoute(app, prisma, baseUrl);
  setupTechniciansCreateRoute(app, prisma, baseUrl);
  setupTechniciansLocationRoute(app, prisma, baseUrl);
  setupWorkordersListRoute(app, prisma, baseUrl);
  setupWorkordersCreateRoute(app, prisma, baseUrl);
  setupWorkordersUpdateRoute(app, prisma, baseUrl);
  setupWorkordersStartRoute(app, prisma, baseUrl);
  setupWorkordersCompleteRoute(app, prisma, baseUrl);
  setupWorkorderTasksRoute(app, prisma, baseUrl);
  setupTasksCompleteRoute(app, prisma, baseUrl);
  setupChecklistRoute(app, prisma, baseUrl);
  setupTimeTrackingStartRoute(app, prisma, baseUrl);
  setupTimeTrackingStopRoute(app, prisma, baseUrl);
}
