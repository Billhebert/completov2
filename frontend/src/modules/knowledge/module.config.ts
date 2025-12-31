/**
 * Base de Conhecimento Module Configuration
 */

import { ModuleConfig } from '../../core/types';

export const knowledgeModuleConfig: ModuleConfig = {
  id: 'knowledge',
  name: 'Base de Conhecimento',
  description: 'Zettelkasten com RAG e busca semântica',
  version: '1.0.0',
  enabled: true,
  category: 'business',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ["knowledge.read"],
};

export default knowledgeModuleConfig;
