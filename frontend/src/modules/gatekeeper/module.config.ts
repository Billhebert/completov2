/**
 * Gatekeeper Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const gatekeeperModuleConfig: ModuleConfig = {
  id: 'gatekeeper',
  name: 'Gatekeeper',
  description: 'Gerenciamento de atenção com IA',
  version: '1.0.0',
  enabled: true,
  category: 'ai',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["gatekeeper.read"],
};

export default gatekeeperModuleConfig;
