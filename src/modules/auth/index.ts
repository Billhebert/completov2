// src/modules/auth/index.ts
import { ModuleDefinition } from '../../core/types';
import { setupAuthRoutes } from './routes';

export const authModule: ModuleDefinition = {
  name: 'auth',
  version: '1.0.0',
  provides: ['authentication', '2fa'],
  
  routes: async (ctx) => {
    setupAuthRoutes(ctx.app, ctx.prisma);
    ctx.logger.info('Auth routes registered');
  },
};
