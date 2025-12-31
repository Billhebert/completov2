/**
 * SSO Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const SsoListPage = lazy(() => import('./pages/SsoListPage'));

export const ssoRoutes: ProtectedRouteConfig[] = [
  {
    path: '/sso',
    element: <SsoListPage />,
    requiredPermissions: [],
    meta: {
      title: 'SSO',
    },
  },
];

export default ssoRoutes;
