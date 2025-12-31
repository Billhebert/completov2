/**
 * Configurações Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const settingsModuleConfig: ModuleConfig = {
  id: 'settings',
  name: 'Configurações',
  description: 'Configurações gerais',
  version: '1.0.0',
  enabled: true,
  category: 'core',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: [],
};

export default settingsModuleConfig;
