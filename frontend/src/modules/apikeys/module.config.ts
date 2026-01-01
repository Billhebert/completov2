// API Keys module configuration
// Provides machine‑to‑machine API key management for the platform.

import type { ModuleConfig } from '@/types/module-config';

export const apikeysModule: ModuleConfig = {
  id: 'apikeys',
  name: 'Chaves API',
  description:
    'Gerencie chaves de API para integrações e automação. É possível listar, criar, revogar e excluir chaves e acompanhar seu uso.',
  version: '1.0.0',
  icon: 'MdVpnKey',
  category: 'administration',
  requiresAuth: true,
  // Restrito a administradores e desenvolvedores
  permissions: ['apikeys.read', 'apikeys.write'],
};

export default apikeysModule;