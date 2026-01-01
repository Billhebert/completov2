/**
 * Parcerias Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const PartnershipsListPage = lazy(() => import('./pages/PartnershipsListPage'));

export const partnershipsRoutes: ProtectedRouteConfig[] = [
  {
    path: '/partnerships',
    element: <PartnershipsListPage />,
    requiredPermissions: ['partnerships.read'],
    meta: {
      title: 'Parcerias',
    },
  },
];

export default partnershipsRoutes;
