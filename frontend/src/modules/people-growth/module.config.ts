/**
 * Crescimento Pessoal Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const peoplegrowthModuleConfig: ModuleConfig = {
  id: 'people-growth',
  name: 'Crescimento Pessoal',
  description: 'Planos de desenvolvimento',
  version: '1.0.0',
  enabled: true,
  category: 'hr',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["people-growth.read"],
};

export default peoplegrowthModuleConfig;
