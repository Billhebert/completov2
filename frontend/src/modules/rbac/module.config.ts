// RBAC module configuration
// Provides UI and API interactions for managing departments, roles and
// permissions within a company. Only company admins and system admins are
// allowed to modify these resources.

import type { ModuleConfig } from '@/types/module-config';

export const rbacModule: ModuleConfig = {
  id: 'rbac',
  name: 'Controle de Acesso',
  description:
    'Gerencie departamentos, cargos personalizados e permissões de usuários com base em funções.',
  version: '1.0.0',
  icon: 'MdSecurity',
  category: 'administration',
  requiresAuth: true,
  permissions: ['rbac.read', 'rbac.write'],
};

export default rbacModule;