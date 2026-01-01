/**
 * Webhooks Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const webhooksModuleConfig: ModuleConfig = {
  id: 'webhooks',
  name: 'Webhooks',
  description: 'Gestão de webhooks',
  version: '1.0.0',
  enabled: true,
  category: 'infrastructure',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["webhooks.read"],
};

export default webhooksModuleConfig;
