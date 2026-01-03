import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { setupConnectionsListRoute } from './connections-list.route';
import { setupConnectionsCreateRoute } from './connections-create.route';
import { setupSyncRunRoute } from './sync-run.route';
import { setupSyncRunsListRoute } from './sync-runs-list.route';
import { setupSyncRunsGetRoute } from './sync-runs-get.route';
import { setupConnectionsSyncRoute } from './connections-sync.route';

export function setupSyncRoutes(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string = '/api/v1/sync'
) {
  setupConnectionsListRoute(app, prisma, baseUrl);
  setupConnectionsCreateRoute(app, prisma, baseUrl);
  setupSyncRunRoute(app, prisma, baseUrl);
  setupSyncRunsListRoute(app, prisma, baseUrl);
  setupSyncRunsGetRoute(app, prisma, baseUrl);
  setupConnectionsSyncRoute(app, prisma, baseUrl);
}
