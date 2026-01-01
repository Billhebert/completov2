import { ModuleConfig } from '../../core/types';

/**
 * Module configuration for the audit module.
 *
 * The audit module surfaces company audit logs, entity history, user
 * activity and aggregate statistics. It requires authentication and
 * appropriate permissions (e.g. `audit.read`) because it exposes
 * potentially sensitive information about user actions and data changes.
 */
const auditModuleConfig: ModuleConfig = {
  id: 'audit',
  name: 'Auditoria',
  description: 'Acompanhe logs de ações, histórico de entidades e estatísticas de auditoria para garantir conformidade.',
  version: '1.0.0',
  category: 'Compliance',
  requiresAuth: true,
  requiredPermissions: ['audit.read'],
};

export default auditModuleConfig;