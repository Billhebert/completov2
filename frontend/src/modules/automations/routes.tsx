/**
 * Automações Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const AutomationsListPage = lazy(() => import('./pages/AutomationsListPage'));

export const automationsRoutes: ProtectedRouteConfig[] = [
  {
    path: '/automations',
    element: <AutomationsListPage />,
    requiredPermissions: ['automations.read'],
    meta: {
      title: 'Automações',
    },
  },
];

export default automationsRoutes;
