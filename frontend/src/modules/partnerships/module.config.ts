/**
 * Parcerias Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const partnershipsModuleConfig: ModuleConfig = {
  id: 'partnerships',
  name: 'Parcerias',
  description: 'Gestão de parcerias B2B',
  version: '1.0.0',
  enabled: true,
  category: 'erp',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["partnerships.read"],
};

export default partnershipsModuleConfig;
