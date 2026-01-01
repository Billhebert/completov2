// CMMS module configuration
// Defines metadata for the CMMS (Computerized Maintenance Management System) module.
// The module id must match the backend provider and will be used by the router
// to register routes and permissions in the UI.

import type { ModuleConfig } from '@/types/module-config';

export const cmmsModule: ModuleConfig = {
  id: 'cmms',
  name: 'CMMS',
  description:
    'Gerencie ativos, planos de manutenção, registros de manutenção, tempos de parada e peças de reposição.',
  version: '1.0.0',
  icon: 'MdBuild',
  category: 'operations',
  // This module requires the user to be authenticated and part of a tenant
  requiresAuth: true,
  // Permissions are enforced on individual routes; by default users need at
  // least leitura (read) permission on cmms resources. Admins can create and
  // update assets, plans, records and inventory.
  permissions: ['asset.read', 'maintenance.read', 'inventory.read'],
};

export default cmmsModule;