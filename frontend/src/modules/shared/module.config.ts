/**
 * Shared Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const sharedModuleConfig: ModuleConfig = {
  id: 'shared',
  name: 'Shared',
  description: 'Componentes compartilhados entre todos os módulos',
  version: '1.0.0',
  enabled: true,
  category: 'core',
  showInMenu: false,
  dependencies: [],
};

export default sharedModuleConfig;
