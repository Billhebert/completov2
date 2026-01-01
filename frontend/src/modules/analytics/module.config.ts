/**
 * Configuração do módulo de Analytics
 *
 * Define metadados e dependências para o módulo de analytics. Este módulo
 * integra-se ao backend para obter dashboards, séries temporais, métricas
 * de funil e exportação de dados CSV. As permissões podem ser ajustadas
 * conforme regras de negócio (leitura de relatórios, etc.).
 */
import { ModuleConfig } from '../../core/types';

export const analyticsModuleConfig: ModuleConfig = {
  id: 'analytics',
  name: 'Analytics',
  description: 'Relatórios e métricas de negócios',
  version: '1.0.0',
  enabled: true,
  category: 'analytics',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['analytics.read'],
};

export default analyticsModuleConfig;