/**
 * ERP Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const erpModuleConfig: ModuleConfig = {
  id: 'erp',
  name: 'ERP',
  description: 'Gestão financeira',
  version: '1.0.0',
  enabled: true,
  category: 'erp',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["erp.read"],
};

export default erpModuleConfig;
