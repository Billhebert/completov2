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
