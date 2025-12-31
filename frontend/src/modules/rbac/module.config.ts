/**
 * RBAC Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const rbacModuleConfig: ModuleConfig = {
  id: 'rbac',
  name: 'RBAC',
  description: 'Controle de acesso',
  version: '1.0.0',
  enabled: true,
  category: 'operations',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["rbac.read"],
};

export default rbacModuleConfig;
