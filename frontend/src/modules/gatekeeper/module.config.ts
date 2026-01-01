/**
 * Configuração do módulo Gatekeeper
 *
 * O Gatekeeper coordena políticas de autonomia e atenção, permitindo que a
 * empresa e o usuário definam níveis de execução, sugestões ou bloqueios
 * para ações sensíveis. Além disso, registra logs de auditoria e permite
 * testar a decisão para ações específicas【311826376132406†L169-L233】.
 */

import { ModuleConfig } from '../../core/types';

export const gatekeeperModuleConfig: ModuleConfig = {
  id: 'gatekeeper',
  name: 'Gatekeeper',
  description: 'Gestão de perfis de atenção e políticas de autonomia',
  version: '1.0.0',
  enabled: true,
  category: 'compliance',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['gatekeeper.read'],
};

export default gatekeeperModuleConfig;
