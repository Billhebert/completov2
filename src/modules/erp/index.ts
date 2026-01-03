import { ModuleDefinition } from '../../core/types';
import { createCrudRoutes } from '../../core/factories/crud-routes.factory';

export const erpModule: ModuleDefinition = {
  name: 'erp',
  version: '1.0.0',
  provides: ['erp', 'products', 'inventory'],
  routes: (ctx) => {
    // Products CRUD via factory
    createCrudRoutes(ctx.app, ctx.prisma, {
      entityName: 'product',
      baseUrl: '/api/v1/erp/products',
      singularName: 'product',
      pluralName: 'products',
      tenantIsolation: true,
      auditLog: false,
      softDelete: false,
      allowedSortFields: ['name', 'sku', 'price', 'createdAt'],

      // Disable operations not yet implemented
      get: { enabled: false },
      update: { enabled: false },
      delete: { enabled: false },
    });

    ctx.logger.info('ERP routes registered');
  }
};
