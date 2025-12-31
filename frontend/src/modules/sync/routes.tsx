/**
 * Sincronização Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const SyncListPage = lazy(() => import('./pages/SyncListPage'));

export const syncRoutes: ProtectedRouteConfig[] = [
  {
    path: '/sync',
    element: <SyncListPage />,
    requiredPermissions: ['sync.read'],
    meta: {
      title: 'Sincronização',
    },
  },
];

export default syncRoutes;
