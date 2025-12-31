/**
 * Gatekeeper Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const GatekeeperListPage = lazy(() => import('./pages/GatekeeperListPage'));

export const gatekeeperRoutes: ProtectedRouteConfig[] = [
  {
    path: '/gatekeeper',
    element: <GatekeeperListPage />,
    requiredPermissions: ['gatekeeper.read'],
    meta: {
      title: 'Gatekeeper',
    },
  },
];

export default gatekeeperRoutes;
