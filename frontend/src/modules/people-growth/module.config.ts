/**
 * Configuração do módulo People Growth
 *
 * Este módulo possibilita detectar e acompanhar gaps de competências,
 * sugerir trilhas de aprendizagem e gerar relatórios para apoiar o
 * desenvolvimento profissional. Supervisores e admins também podem
 * acompanhar o progresso da equipe através de relatórios e heatmaps【449516623417123†L132-L203】.
 */

import { ModuleConfig } from '../../core/types';

export const peopleGrowthModuleConfig: ModuleConfig = {
  id: 'people-growth',
  name: 'People Growth',
  description: 'Gestão de gaps de habilidades e desenvolvimento de pessoas',
  version: '1.0.0',
  enabled: true,
  category: 'hr',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['people-growth.read'],
};

export default peopleGrowthModuleConfig;
