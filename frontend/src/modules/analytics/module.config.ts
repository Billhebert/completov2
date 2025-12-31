/**
 * Analytics Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const analyticsModuleConfig: ModuleConfig = {
  id: 'analytics',
  name: 'Analytics',
  description: 'Business intelligence e relatórios',
  version: '1.0.0',
  enabled: true,
  category: 'operations',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["analytics.read"],
};

export default analyticsModuleConfig;
