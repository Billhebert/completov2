/**
 * Configuração do módulo de Serviços
 *
 * Este módulo implementa as interfaces para o marketplace de serviços B2B. As
 * empresas podem listar e ofertar serviços, assim como enviar e gerenciar
 * propostas. Operações sensíveis (criar, atualizar, excluir) requerem
 * permissões de administrador ou papéis específicos【522691621467066†L17-L110】.
 */

import { ModuleConfig } from '../../core/types';

export const servicesModuleConfig: ModuleConfig = {
  id: 'services',
  name: 'Serviços',
  description: 'Marketplace interno de serviços e propostas',
  version: '1.0.0',
  enabled: true,
  category: 'marketplace',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['services.read'],
};

export default servicesModuleConfig;