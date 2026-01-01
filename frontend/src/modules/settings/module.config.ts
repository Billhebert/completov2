// System Settings module configuration
// Exposes the ability to view and update system‑wide configuration. Only DEV and
// admin roles are allowed to interact with this module according to the
// backend【240892291532403†L16-L25】.

import type { ModuleConfig } from '@/types/module-config';

export const settingsModule: ModuleConfig = {
  id: 'settings',
  name: 'Configurações',
  description:
    'Gerencie as configurações globais do sistema, incluindo taxas de serviço e moeda. Apenas usuários DEV ou administradores podem acessar.',
  version: '1.0.0',
  icon: 'MdSettings',
  category: 'administration',
  requiresAuth: true,
  permissions: ['settings.read', 'settings.update'],
};

export default settingsModule;