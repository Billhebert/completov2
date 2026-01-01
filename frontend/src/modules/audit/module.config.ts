/**
 * Auditoria Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const auditModuleConfig: ModuleConfig = {
  id: 'audit',
  name: 'Auditoria',
  description: 'Logs de auditoria',
  version: '1.0.0',
  enabled: true,
  category: 'infrastructure',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["audit.read"],
};

export default auditModuleConfig;
