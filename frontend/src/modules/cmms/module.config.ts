/**
 * CMMS Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const cmmsModuleConfig: ModuleConfig = {
  id: 'cmms',
  name: 'CMMS',
  description: 'Gestão de ativos e manutenção',
  version: '1.0.0',
  enabled: true,
  category: 'specialized',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["cmms.read"],
};

export default cmmsModuleConfig;
