/**
 * Busca Global Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const searchModuleConfig: ModuleConfig = {
  id: 'search',
  name: 'Busca Global',
  description: 'Sistema de busca cross-module',
  version: '1.0.0',
  enabled: true,
  category: 'infrastructure',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: [],
};

export default searchModuleConfig;
