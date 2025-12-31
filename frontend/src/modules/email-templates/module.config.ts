/**
 * Templates de Email Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const emailtemplatesModuleConfig: ModuleConfig = {
  id: 'email-templates',
  name: 'Templates de Email',
  description: 'Gestão de templates',
  version: '1.0.0',
  enabled: true,
  category: 'specialized',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["email-templates.read"],
};

export default emailtemplatesModuleConfig;
