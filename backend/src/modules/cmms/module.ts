// src/modules/cmms/module.ts
import { ModuleDefinition } from '../../core/types';
import { setupCmmsRoutes } from './routes';

export const cmmsModule: ModuleDefinition = {
  name: 'cmms',
  version: '1.0.0',
  provides: ['cmms', 'assets', 'maintenance', 'spare-parts'],
  description: 'Computerized Maintenance Management System',
  routes: (ctx) => {
    setupCmmsRoutes(ctx.app, ctx.prisma, '/api/v1/cmms');
    ctx.logger.info('CMMS routes registered');
  },
};
