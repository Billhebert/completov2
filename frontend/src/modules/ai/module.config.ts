/**
 * IA Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const aiModuleConfig: ModuleConfig = {
  id: 'ai',
  name: 'IA',
  description: 'Integração com LLMs, Agents e RAG',
  version: '1.0.0',
  enabled: true,
  category: 'ai',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['ai.read'],
};

export default aiModuleConfig;
