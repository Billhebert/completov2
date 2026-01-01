/**
 * Narrativas IA Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const narrativeModuleConfig: ModuleConfig = {
  id: 'narrative',
  name: 'Narrativas IA',
  description: 'Geração de narrativas com IA',
  version: '1.0.0',
  enabled: true,
  category: 'ai',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["narrative.read"],
};

export default narrativeModuleConfig;
