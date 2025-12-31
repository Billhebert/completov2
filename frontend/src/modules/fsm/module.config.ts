/**
 * Field Service Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const fsmModuleConfig: ModuleConfig = {
  id: 'fsm',
  name: 'Field Service',
  description: 'Gestão de serviços em campo',
  version: '1.0.0',
  enabled: true,
  category: 'specialized',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["fsm.read"],
};

export default fsmModuleConfig;
