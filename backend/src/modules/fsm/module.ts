// src/modules/fsm/module.ts
import { ModuleDefinition } from '../../core/types';
import registerFSMRoutes from './index';

export const fsmModule: ModuleDefinition = {
  name: 'fsm',
  version: '1.0.0',
  provides: ['fsm', 'field-service', 'work-orders', 'technicians'],
  description: 'Field Service Management',
  routes: (ctx) => {
    registerFSMRoutes(ctx.app);
  },
};
