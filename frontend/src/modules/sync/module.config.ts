/**
 * Sincronização Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const syncModuleConfig: ModuleConfig = {
  id: 'sync',
  name: 'Sincronização',
  description: 'Integração com sistemas terceiros',
  version: '1.0.0',
  enabled: true,
  category: 'infrastructure',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["sync.read"],
};

export default syncModuleConfig;
