import { ModuleDefinition } from '../../core/types';
import { authenticate, tenantIsolation } from '../../core/middleware';
import gatekeeperRoutes from './index';

export const gatekeeperModule: ModuleDefinition = {
  name: 'gatekeeper',
  version: '1.0.0',
  provides: ['gatekeeper', 'attention-management', 'focus'],

  routes: async (ctx) => {
    ctx.app.use('/api/v1/gatekeeper', authenticate, tenantIsolation, gatekeeperRoutes);
    ctx.logger.info('Gatekeeper routes registered');
  },
};
