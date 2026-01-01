/**
 * Configuração do módulo de Webhooks
 *
 * Este módulo fornece gerenciamento de eventos e endpoints para webhooks. Usuários
 * autenticados podem listar e cadastrar definições de eventos e endpoints,
 * visualizar logs de entrega e testar a entrega de webhooks. Requer
 * autenticação e permissões administrativas para operações de criação e
 * alteração de endpoints.【913635998450837†L15-L45】
 */

import { ModuleConfig } from '../../core/types';

export const webhooksModuleConfig: ModuleConfig = {
  id: 'webhooks',
  name: 'Webhooks',
  description: 'Configurações e logs de webhooks de eventos da plataforma',
  version: '1.0.0',
  enabled: true,
  category: 'integration',
  showInMenu: false,
  dependencies: ['auth'],
  requiredPermissions: ['webhooks.read'],
};

export default webhooksModuleConfig;