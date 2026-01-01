/**
 * Arquivos Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const filesModuleConfig: ModuleConfig = {
  id: 'files',
  name: 'Arquivos',
  description: 'Gerenciamento de arquivos',
  version: '1.0.0',
  enabled: true,
  category: 'infrastructure',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["files.read"],
};

export default filesModuleConfig;
