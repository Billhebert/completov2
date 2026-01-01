/**
 * Configuração do módulo de IA
 *
 * Define informações básicas e permissões necessárias para acessar os
 * serviços de Inteligência Artificial e RAG disponíveis no backend. O
 * módulo exige autenticação e pode ser controlado via modo de operação
 * (economico, auto, full)【282032691130219†L94-L124】.
 */
import { ModuleConfig } from '../../core/types';

export const aiModuleConfig: ModuleConfig = {
  id: 'ai',
  name: 'Inteligência Artificial',
  description: 'Consultas RAG, chat AI e controle de modo de IA',
  version: '1.0.0',
  enabled: true,
  category: 'ai',
  showInMenu: false,
  dependencies: ['auth'],
  requiredPermissions: ['ai.read'],
};

export default aiModuleConfig;