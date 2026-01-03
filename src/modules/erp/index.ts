import { ModuleDefinition } from '../../core/types';
import { setupErpRoutes } from './routes/setup';

export const erpModule: ModuleDefinition = {
  name: 'erp',
  version: '1.0.0',
  provides: ['erp', 'products', 'inventory'],
  routes: (ctx) => {
    setupErpRoutes(ctx.app, ctx.prisma, '/api/v1/erp');
    ctx.logger.info('ERP routes registered');
  }
};
