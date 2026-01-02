// src/modules/mcp/module.ts
import { ModuleDefinition } from '../../core/types';
import registerMCPRoutes from './index';

export const mcpModule: ModuleDefinition = {
  name: 'mcp',
  version: '1.0.0',
  provides: ['mcp', 'model-context-protocol', 'ai-servers'],
  description: 'Model Context Protocol for AI integration',
  routes: (ctx) => {
    registerMCPRoutes(ctx.app);
  },
};
