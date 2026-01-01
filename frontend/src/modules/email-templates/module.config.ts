/**
 * Configuração do módulo de Templates de Email
 *
 * Este módulo disponibiliza a listagem, pré-visualização e envio de
 * modelos de email configurados no backend. Ideal para enviar emails
 * transacionais com layout padronizado【533419220309048†L11-L66】.
 */

import { ModuleConfig } from '../../core/types';

export const emailTemplatesModuleConfig: ModuleConfig = {
  id: 'email-templates',
  name: 'Templates de Email',
  description: 'Listagem e envio de modelos de email transacionais',
  version: '1.0.0',
  enabled: true,
  category: 'communications',
  showInMenu: false,
  dependencies: ['auth'],
  requiredPermissions: ['email.read'],
};

export default emailTemplatesModuleConfig;