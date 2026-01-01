/**
 * Omnichannel Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const omnichannelModuleConfig: ModuleConfig = {
  id: 'omnichannel',
  name: 'Omnichannel',
  description: 'Atendimento multicanal',
  version: '1.0.0',
  enabled: true,
  category: 'operations',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["omnichannel.read"],
};

export default omnichannelModuleConfig;
