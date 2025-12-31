/**
 * MCP Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const mcpModuleConfig: ModuleConfig = {
  id: 'mcp',
  name: 'MCP',
  description: 'Model Context Protocol',
  version: '1.0.0',
  enabled: true,
  category: 'infrastructure',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["mcp.read"],
};

export default mcpModuleConfig;
