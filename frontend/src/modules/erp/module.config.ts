/**
 * Configuração do módulo de ERP
 *
 * Este módulo fornece operações básicas de inventário (produtos) e serve
 * como base para integrações financeiras e fiscais mais complexas. Caso
 * novas funcionalidades sejam incorporadas (pagamentos, relatórios, etc.),
 * esta configuração pode ser atualizada para refletir as dependências e
 * permissões necessárias.
 */
import { ModuleConfig } from '../../core/types';

export const erpModuleConfig: ModuleConfig = {
  id: 'erp',
  name: 'ERP',
  description: 'Recursos de gestão empresarial (produtos e finanças)',
  version: '1.0.0',
  enabled: true,
  category: 'erp',
  showInMenu: true,
  dependencies: ['auth'],
  requiredPermissions: ['erp.read'],
};

export default erpModuleConfig;