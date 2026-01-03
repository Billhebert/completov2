import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../../core/event-bus';
import { ModuleDefinition } from '../../core/types';
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';
import { setupAssignRoleRoute, setupPermissionsListRoute } from './routes';

function setupRoutes(app: Express, prisma: PrismaClient, eventBus: EventBus) {
  const base = '/api/v1/rbac';

  // Roles CRUD via factory
  createCrudRoutes(app, prisma, {
    entityName: 'role',
    baseUrl: `${base}/roles`,
    singularName: 'role',
    pluralName: 'roles',
    tenantIsolation: true,
    auditLog: false,
    softDelete: false,
    allowedSortFields: ['name', 'createdAt'],

    // Disable operations not yet implemented
    get: { enabled: false },
    update: { enabled: false },
    delete: { enabled: false },
  });

  // Custom RBAC routes
  setupAssignRoleRoute(app, prisma, base);
  setupPermissionsListRoute(app, prisma, base);
}

export const rbacModule: ModuleDefinition = {
  name: 'rbac',
  version: '1.0.0',
  provides: ['rbac'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma, ctx.eventBus),
};
