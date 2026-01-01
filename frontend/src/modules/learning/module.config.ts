/**
 * Aprendizado Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const learningModuleConfig: ModuleConfig = {
  id: 'learning',
  name: 'Aprendizado',
  description: 'Trilhas de aprendizado',
  version: '1.0.0',
  enabled: true,
  category: 'hr',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["learning.read"],
};

export default learningModuleConfig;
