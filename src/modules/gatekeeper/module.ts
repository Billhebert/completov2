import { ModuleDefinition } from '../../core/types';
import gatekeeperRoutes from './index';

export const gatekeeperModule: ModuleDefinition = {
  name: 'gatekeeper',
  version: '1.0.0',
  provides: ['attention-management', 'autonomy-control'],

  routes: async (ctx) => {
    ctx.app.use('/api/v1/gatekeeper', gatekeeperRoutes);
    ctx.logger.info('Gatekeeper routes registered');
  },
};
