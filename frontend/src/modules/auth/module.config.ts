/**
 * Auth Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const authModuleConfig: ModuleConfig = {
  id: 'auth',
  name: 'Autenticação',
  description: 'Sistema de autenticação, login, registro e 2FA',
  version: '1.0.0',
  enabled: true,
  category: 'core',
  showInMenu: false,
  dependencies: [],
};

export default authModuleConfig;
