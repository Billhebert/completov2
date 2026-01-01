/**
 * CRM Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const crmModuleConfig: ModuleConfig = {
  id: 'crm',
  name: 'CRM',
  description: 'Gestão de contatos, empresas e deals',
  version: '1.0.0',
  enabled: true,
  category: 'business',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["crm.read"],
};

export default crmModuleConfig;
