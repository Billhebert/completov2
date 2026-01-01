/**
 * SSO Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const ssoModuleConfig: ModuleConfig = {
  id: 'sso',
  name: 'SSO',
  description: 'Single Sign-On',
  version: '1.0.0',
  enabled: true,
  category: 'infrastructure',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: [],
};

export default ssoModuleConfig;
