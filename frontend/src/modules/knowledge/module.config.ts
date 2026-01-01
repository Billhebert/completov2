/**
 * Knowledge Module Configuration
 */
import { ModuleConfig } from '../../core/types';

export const knowledgeModuleConfig: ModuleConfig = {
  id: 'knowledge',
  name: 'Knowledge',
  description: 'Base de Conhecimento (Zettelkasten)',
  version: '1.0.0',
  enabled: true,
  category: 'knowledge',
  showInMenu: true,
  // Este módulo depende de autenticação para restringir acesso aos zettels
  dependencies: ['auth'],
  requiredPermissions: ['knowledge.read'],
};

export default knowledgeModuleConfig;