/**
 * Notificações Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const notificationsModuleConfig: ModuleConfig = {
  id: 'notifications',
  name: 'Notificações',
  description: 'Sistema de notificações multicanal',
  version: '1.0.0',
  enabled: true,
  category: 'operations',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: [],
};

export default notificationsModuleConfig;
