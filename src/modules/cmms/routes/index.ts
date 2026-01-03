import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { setupAssetsListRoute } from './assets-list.route';
import { setupAssetsCreateRoute } from './assets-create.route';
import { setupAssetsGetRoute } from './assets-get.route';
import { setupAssetsUpdateRoute } from './assets-update.route';
import { setupMaintenancePlansListRoute } from './maintenance-plans-list.route';
import { setupMaintenancePlansCreateRoute } from './maintenance-plans-create.route';
import { setupMaintenanceRecordsListRoute } from './maintenance-records-list.route';
import { setupMaintenanceRecordsCreateRoute } from './maintenance-records-create.route';
import { setupDowntimeCreateRoute } from './downtime-create.route';
import { setupDowntimeResolveRoute } from './downtime-resolve.route';
import { setupSparePartsListRoute } from './spare-parts-list.route';
import { setupSparePartsLowStockRoute } from './spare-parts-low-stock.route';
import { setupSparePartsCreateRoute } from './spare-parts-create.route';
import { setupSparePartsMovementRoute } from './spare-parts-movement.route';

export function setupCmmsRoutes(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string = '/api/v1/cmms'
) {
  // Assets
  setupAssetsListRoute(app, prisma, baseUrl);
  setupAssetsCreateRoute(app, prisma, baseUrl);
  setupAssetsGetRoute(app, prisma, baseUrl);
  setupAssetsUpdateRoute(app, prisma, baseUrl);

  // Maintenance Plans
  setupMaintenancePlansListRoute(app, prisma, baseUrl);
  setupMaintenancePlansCreateRoute(app, prisma, baseUrl);

  // Maintenance Records
  setupMaintenanceRecordsListRoute(app, prisma, baseUrl);
  setupMaintenanceRecordsCreateRoute(app, prisma, baseUrl);

  // Downtime
  setupDowntimeCreateRoute(app, prisma, baseUrl);
  setupDowntimeResolveRoute(app, prisma, baseUrl);

  // Spare Parts
  setupSparePartsListRoute(app, prisma, baseUrl);
  setupSparePartsLowStockRoute(app, prisma, baseUrl);
  setupSparePartsCreateRoute(app, prisma, baseUrl);
  setupSparePartsMovementRoute(app, prisma, baseUrl);
}
