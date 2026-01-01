/**
 * Deduplicação IA Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const deduplicationModuleConfig: ModuleConfig = {
  id: 'deduplication',
  name: 'Deduplicação IA',
  description: 'Detecção de duplicatas com IA',
  version: '1.0.0',
  enabled: true,
  category: 'ai',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["deduplication.read"],
};

export default deduplicationModuleConfig;
