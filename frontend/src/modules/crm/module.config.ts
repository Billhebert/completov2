/**
 * Configuração do módulo de CRM
 *
 * Define metadados e dependências para o módulo de Customer Relationship Management
 * que fornece recursos de gestão de contatos, negócios e interações. Esta
 * configuração segue o mesmo formato utilizado pelos demais módulos e pode
 * ser utilizada pelo container de módulos da aplicação para habilitar
 * dinamicamente funcionalidades, aplicar permissões e categorizar módulos.
 */
import { ModuleConfig } from '../../core/types';

export const crmModuleConfig: ModuleConfig = {
  id: 'crm',
  name: 'CRM',
  description: 'Gestão de contatos, negócios e interações',
  version: '1.0.0',
  enabled: true,
  category: 'crm',
  showInMenu: true,
  // O módulo de CRM depende de autenticação e exige permissão de leitura de CRM
  dependencies: ['auth'],
  requiredPermissions: ['crm.read'],
};

export default crmModuleConfig;