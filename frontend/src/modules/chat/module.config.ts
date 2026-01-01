/**
 * Chat Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const chatModuleConfig: ModuleConfig = {
  id: 'chat',
  name: 'Chat',
  description: 'Sistema de mensagens em tempo real',
  version: '1.0.0',
  enabled: true,
  category: 'business',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["chat.read"],
};

export default chatModuleConfig;
