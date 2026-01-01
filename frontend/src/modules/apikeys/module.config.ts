/**
 * API Keys Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const apikeysModuleConfig: ModuleConfig = {
  id: 'apikeys',
  name: 'API Keys',
  description: 'Gerenciamento de API keys',
  version: '1.0.0',
  enabled: true,
  category: 'infrastructure',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["apikeys.read"],
};

export default apikeysModuleConfig;
