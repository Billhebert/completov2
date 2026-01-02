// src/modules/cmms/module.ts
import { ModuleDefinition } from '../../core/types';
import registerCMMSRoutes from './index';

export const cmmsModule: ModuleDefinition = {
  name: 'cmms',
  version: '1.0.0',
  provides: ['cmms', 'assets', 'maintenance', 'spare-parts'],
  description: 'Computerized Maintenance Management System',
  routes: (ctx) => {
    registerCMMSRoutes(ctx.app);
  },
};
