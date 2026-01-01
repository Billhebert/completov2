/**
 * Configuração do módulo Search
 *
 * Este módulo provê funcionalidade de busca global, sugestões de autocomplete
 * e histórico de pesquisas recentes. Ele se integra ao backend para retornar
 * resultados em múltiplas entidades (contatos, negócios, mensagens, produtos e conhecimento)
 * de forma unificada【385437886412116†L11-L24】.
 */

import { ModuleConfig } from '../../core/types';

export const searchModuleConfig: ModuleConfig = {
  id: 'search',
  name: 'Pesquisa',
  description: 'Busca unificada, sugestões e histórico de pesquisas',
  version: '1.0.0',
  enabled: true,
  category: 'search',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['search.read'],
};

export default searchModuleConfig;
