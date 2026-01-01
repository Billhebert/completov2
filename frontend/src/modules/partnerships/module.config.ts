// Partnerships module configuration
// This module provides management of company partnerships and invites.

import type { ModuleConfig } from '@/types/module-config';

export const partnershipsModule: ModuleConfig = {
  id: 'partnerships',
  name: 'Parcerias',
  description:
    'Gerencie parcerias entre empresas, incluindo convites, criação, atualização e encerramento.',
  version: '1.0.0',
  icon: 'MdHandshake',
  category: 'administration',
  requiresAuth: true,
  permissions: ['partnerships.read', 'partnerships.write'],
};

export default partnershipsModule;