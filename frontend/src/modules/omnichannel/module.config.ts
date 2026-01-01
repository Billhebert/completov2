/**
 * Configuração do módulo Omnichannel
 *
 * Este módulo permite gerenciar contas WhatsApp e conversas integradas
 * à plataforma Evolution API. A interface de frontend usa este arquivo
 * para descrever metadados e dependências, incluindo permissões necessárias
 * para acessar as rotas de omnichannel.
 */

import { ModuleConfig } from '../../core/types';

export const omnichannelModuleConfig: ModuleConfig = {
  id: 'omnichannel',
  name: 'Omnichannel',
  description: 'Integração de canais (WhatsApp) e gerenciamento de conversas',
  version: '1.0.0',
  enabled: true,
  category: 'communication',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['omnichannel.read'],
};

export default omnichannelModuleConfig;
