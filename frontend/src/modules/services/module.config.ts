/**
 * Serviços Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const servicesModuleConfig: ModuleConfig = {
  id: 'services',
  name: 'Serviços',
  description: 'Marketplace de serviços',
  version: '1.0.0',
  enabled: true,
  category: 'erp',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["services.read"],
};

export default servicesModuleConfig;
