import { ModuleConfig } from '../../core/types';

/**
 * Configuration for the authentication module.
 *
 * This module handles core authentication flows such as login, registration,
 * token refresh and 2FA. It is always required and therefore does not
 * specify `requiredPermissions` (authentication itself controls access).
 */
const authModuleConfig: ModuleConfig = {
  id: 'auth',
  name: 'Autenticação',
  description: 'Gerencia login, registro de novas empresas, autenticação em duas etapas e informações do usuário.',
  version: '1.0.0',
  category: 'Core',
  requiresAuth: false,
  requiredPermissions: [],
};

export default authModuleConfig;