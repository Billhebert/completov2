/**
 * Register All Module Routes
 * Registra automaticamente todas as rotas de todos os módulos
 */

import { routeRegistry } from './RouteRegistry';
import { lazy, createElement } from 'react';

// Import routes from all modules
import authRoutes from '../../modules/auth/routes';
import crmRoutes from '../../modules/crm/routes';
import chatRoutes from '../../modules/chat/routes';
import knowledgeRoutes from '../../modules/knowledge/routes';
import aiRoutes from '../../modules/ai/routes';
import automationsRoutes from '../../modules/automations/routes';
import narrativeRoutes from '../../modules/narrative/routes';
import deduplicationRoutes from '../../modules/deduplication/routes';
import gatekeeperRoutes from '../../modules/gatekeeper/routes';
import omnichannelRoutes from '../../modules/omnichannel/routes';
import analyticsRoutes from '../../modules/analytics/routes';
import notificationsRoutes from '../../modules/notifications/routes';
import rbacRoutes from '../../modules/rbac/routes';
import webhooksRoutes from '../../modules/webhooks/routes';
import filesRoutes from '../../modules/files/routes';
import searchRoutes from '../../modules/search/routes';
import auditRoutes from '../../modules/audit/routes';
import apikeysRoutes from '../../modules/apikeys/routes';
import syncRoutes from '../../modules/sync/routes';
import ssoRoutes from '../../modules/sso/routes';
import mcpRoutes from '../../modules/mcp/routes';
import erpRoutes from '../../modules/erp/routes';
import servicesRoutes from '../../modules/services/routes';
import partnershipsRoutes from '../../modules/partnerships/routes';
import peoplegrowthRoutes from '../../modules/people-growth/routes';
import jobsRoutes from '../../modules/jobs/routes';
import learningRoutes from '../../modules/learning/routes';
import fsmRoutes from '../../modules/fsm/routes';
import cmmsRoutes from '../../modules/cmms/routes';
import simulationRoutes from '../../modules/simulation/routes';
import emailtemplatesRoutes from '../../modules/email-templates/routes';
import settingsRoutes from '../../modules/settings/routes';
import feedbackRoutes from '../../modules/feedback/routes';

// Main Pages
const DashboardPage = lazy(() => import('../../pages/Dashboard'));
const ProfilePage = lazy(() => import('../../pages/Profile'));
const SettingsPage = lazy(() => import('../../pages/Settings'));

const dashboardRoutes = [
  {
    path: '/dashboard',
    element: createElement(DashboardPage),
    requiresAuth: true,
    meta: {
      title: 'Dashboard',
    },
  },
];

const profileRoutes = [
  {
    path: '/profile',
    element: createElement(ProfilePage),
    requiresAuth: true,
    meta: {
      title: 'Meu Perfil',
    },
  },
];

const settingsPageRoutes = [
  {
    path: '/settings',
    element: createElement(SettingsPage),
    requiresAuth: true,
    meta: {
      title: 'Configurações',
    },
  },
];

/**
 * Registrar todas as rotas de todos os módulos
 */
export const registerAllRoutes = () => {
  // Register auth routes (public)
  routeRegistry.registerModuleRoutes('auth', authRoutes);

  // Register main pages
  routeRegistry.registerModuleRoutes('dashboard', dashboardRoutes);
  routeRegistry.registerModuleRoutes('profile', profileRoutes);
  routeRegistry.registerModuleRoutes('settings-page', settingsPageRoutes);

  // Register business modules
  routeRegistry.registerModuleRoutes('crm', crmRoutes);
  routeRegistry.registerModuleRoutes('chat', chatRoutes);
  routeRegistry.registerModuleRoutes('knowledge', knowledgeRoutes);

  // Register AI modules
  routeRegistry.registerModuleRoutes('ai', aiRoutes);
  routeRegistry.registerModuleRoutes('automations', automationsRoutes);
  routeRegistry.registerModuleRoutes('narrative', narrativeRoutes);
  routeRegistry.registerModuleRoutes('deduplication', deduplicationRoutes);
  routeRegistry.registerModuleRoutes('gatekeeper', gatekeeperRoutes);

  // Register operations modules
  routeRegistry.registerModuleRoutes('omnichannel', omnichannelRoutes);
  routeRegistry.registerModuleRoutes('analytics', analyticsRoutes);
  routeRegistry.registerModuleRoutes('notifications', notificationsRoutes);
  routeRegistry.registerModuleRoutes('rbac', rbacRoutes);

  // Register infrastructure modules
  routeRegistry.registerModuleRoutes('webhooks', webhooksRoutes);
  routeRegistry.registerModuleRoutes('files', filesRoutes);
  routeRegistry.registerModuleRoutes('search', searchRoutes);
  routeRegistry.registerModuleRoutes('audit', auditRoutes);
  routeRegistry.registerModuleRoutes('apikeys', apikeysRoutes);
  routeRegistry.registerModuleRoutes('sync', syncRoutes);
  routeRegistry.registerModuleRoutes('sso', ssoRoutes);
  routeRegistry.registerModuleRoutes('mcp', mcpRoutes);

  // Register ERP modules
  routeRegistry.registerModuleRoutes('erp', erpRoutes);
  routeRegistry.registerModuleRoutes('services', servicesRoutes);
  routeRegistry.registerModuleRoutes('partnerships', partnershipsRoutes);

  // Register HR modules
  routeRegistry.registerModuleRoutes('people-growth', peoplegrowthRoutes);
  routeRegistry.registerModuleRoutes('jobs', jobsRoutes);
  routeRegistry.registerModuleRoutes('learning', learningRoutes);

  // Register specialized modules
  routeRegistry.registerModuleRoutes('fsm', fsmRoutes);
  routeRegistry.registerModuleRoutes('cmms', cmmsRoutes);
  routeRegistry.registerModuleRoutes('simulation', simulationRoutes);
  routeRegistry.registerModuleRoutes('email-templates', emailtemplatesRoutes);

  // Register settings
  routeRegistry.registerModuleRoutes('settings', settingsRoutes);
  routeRegistry.registerModuleRoutes('feedback', feedbackRoutes);
};

export default registerAllRoutes;
