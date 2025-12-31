/**
 * Simulações Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const simulationModuleConfig: ModuleConfig = {
  id: 'simulation',
  name: 'Simulações',
  description: 'Simulações de treinamento',
  version: '1.0.0',
  enabled: true,
  category: 'specialized',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["simulation.read"],
};

export default simulationModuleConfig;
