/**
 * CMMS Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const CmmsListPage = lazy(() => import('./pages/CmmsListPage'));

export const cmmsRoutes: ProtectedRouteConfig[] = [
  {
    path: '/cmms',
    element: <CmmsListPage />,
    requiredPermissions: ['cmms.read'],
    meta: {
      title: 'CMMS',
    },
  },
];

export default cmmsRoutes;
