/**
 * RBAC Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const RbacListPage = lazy(() => import('./pages/RbacListPage'));

export const rbacRoutes: ProtectedRouteConfig[] = [
  {
    path: '/rbac',
    element: <RbacListPage />,
    requiredPermissions: ['rbac.read'],
    meta: {
      title: 'RBAC',
    },
  },
];

export default rbacRoutes;
