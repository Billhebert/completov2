// src/modules/fsm/module.ts
import { ModuleDefinition } from '../../core/types';
import { setupFsmRoutes } from './routes/setup';

export const fsmModule: ModuleDefinition = {
  name: 'fsm',
  version: '1.0.0',
  provides: ['fsm', 'field-service', 'work-orders', 'technicians'],
  description: 'Field Service Management',
  routes: (ctx) => {
    setupFsmRoutes(ctx.app, ctx.prisma, '/api/v1/fsm');
    ctx.logger.info('FSM routes registered');
  },
};
