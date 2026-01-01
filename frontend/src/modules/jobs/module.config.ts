/**
 * Vagas Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const jobsModuleConfig: ModuleConfig = {
  id: 'jobs',
  name: 'Vagas',
  description: 'Recrutamento e seleção',
  version: '1.0.0',
  enabled: true,
  category: 'hr',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["jobs.read"],
};

export default jobsModuleConfig;
