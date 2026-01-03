import { ModuleDefinition } from '../../core/types';
import { setupNarrativeRoutes } from './routes';

export const narrativeModule: ModuleDefinition = {
  name: 'narrative',
  version: '1.0.0',
  provides: ['narrative', 'storytelling', 'reports'],

  routes: async (ctx) => {
    setupNarrativeRoutes(ctx.app, ctx.prisma, '/api/v1/narrative');
    ctx.logger.info('Narrative routes registered');
  },
};
