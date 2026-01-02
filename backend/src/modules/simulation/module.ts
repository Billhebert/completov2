import { ModuleDefinition } from '../../core/types';
import simulationRoutes from './index';

export const simulationModule: ModuleDefinition = {
  name: 'simulation',
  version: '1.0.0',
  provides: ['simulation-engine', 'training'],

  routes: async (ctx) => {
    ctx.app.use('/api/v1/simulation', simulationRoutes);
    ctx.logger.info('Simulation routes registered');
  },
};
import { ModuleDefinition } from '../../core/types';
import { authenticate, tenantIsolation } from '../../core/middleware';
import simulationRoutes from './index';

export const simulationModule: ModuleDefinition = {
  name: 'simulation',
  version: '1.0.0',
  provides: ['simulation', 'scenarios', 'training'],

  routes: async (ctx) => {
    ctx.app.use('/api/v1/simulation', authenticate, tenantIsolation, simulationRoutes);
    ctx.logger.info('Simulation routes registered');
  },
};
