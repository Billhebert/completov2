import { ModuleDefinition } from '../../core/types';
import { setupSimulationRoutes } from './routes';

export const simulationModule: ModuleDefinition = {
  name: 'simulation',
  version: '1.0.0',
  provides: ['simulation', 'scenarios', 'training', 'evaluation'],

  routes: async (ctx) => {
    setupSimulationRoutes(ctx.app, ctx.prisma, '/api/v1/simulation');
    ctx.logger.info('Simulation routes registered');
  },
};
