import { ModuleDefinition } from '../../core/types';
import narrativeRoutes from './index';

export const narrativeModule: ModuleDefinition = {
  name: 'narrative',
  version: '1.0.0',
  provides: ['narrative-engine', 'story-generation'],

  routes: async (ctx) => {
    ctx.app.use('/api/v1/narrative', narrativeRoutes);
    ctx.logger.info('Narrative routes registered');
  },
};
import { ModuleDefinition } from '../../core/types';
import { authenticate, tenantIsolation } from '../../core/middleware';
import narrativeRoutes from './index';

export const narrativeModule: ModuleDefinition = {
  name: 'narrative',
  version: '1.0.0',
  provides: ['narrative', 'storytelling', 'reports'],

  routes: async (ctx) => {
    ctx.app.use('/api/v1/narrative', authenticate, tenantIsolation, narrativeRoutes);
    ctx.logger.info('Narrative routes registered');
  },
};
