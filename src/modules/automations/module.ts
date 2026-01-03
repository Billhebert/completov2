import { ModuleDefinition } from '../../core/types';
import { authenticate, tenantIsolation } from '../../core/middleware';
import automationsRoutes from './index';

export const automationsModule: ModuleDefinition = {
  name: 'automations',
  version: '1.0.0',
  provides: ['workflow-engine', 'automation'],

  routes: async (ctx) => {
    ctx.app.use('/api/v1/automations', authenticate, tenantIsolation, automationsRoutes);
    ctx.logger.info('Automations routes registered');
  },
};
