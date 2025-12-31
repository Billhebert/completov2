/**
 * Automações Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const automationsModuleConfig: ModuleConfig = {
  id: 'automations',
  name: 'Automações',
  description: 'Editor de workflows visual',
  version: '1.0.0',
  enabled: true,
  category: 'ai',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["automations.read"],
};

export default automationsModuleConfig;
