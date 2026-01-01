/**
 * Configuração do módulo Sync
 *
 * Este módulo lida com a criação de conexões de integração e a execução de
 * processos de sincronização. Usuários autenticados podem listar
 * conexões, criar novas integrações com provedores externos (como RD
 * Station ou Chatwoot) e acionar sincronizações de dados, tanto
 * enfileiradas quanto manuais【643399667495487†L25-L54】.
 */

import { ModuleConfig } from '../../core/types';

export const syncModuleConfig: ModuleConfig = {
  id: 'sync',
  name: 'Sincronização',
  description: 'Integrações e sincronização de dados com provedores externos',
  version: '1.0.0',
  enabled: true,
  category: 'integrations',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['sync.read'],
};

export default syncModuleConfig;
