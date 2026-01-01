/**
 * Configuração do módulo de Vagas (Jobs)
 *
 * Este módulo engloba todas as operações relacionadas a vagas de emprego:
 * listagem com filtros de acesso, criação e edição de vagas por admins,
 * candidaturas de usuários, marcação de interesse e análise de candidatos.
 */

import { ModuleConfig } from '../../core/types';

export const jobsModuleConfig: ModuleConfig = {
  id: 'jobs',
  name: 'Vagas',
  description: 'Gerenciamento de vagas de emprego e candidaturas',
  version: '1.0.0',
  enabled: true,
  category: 'recruitment',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['jobs.read'],
};

export default jobsModuleConfig;
