/**
 * ERP Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const ErpListPage = lazy(() => import('./pages/ErpListPage'));

export const erpRoutes: ProtectedRouteConfig[] = [
  {
    path: '/erp',
    element: <ErpListPage />,
    requiredPermissions: ['erp.read'],
    meta: {
      title: 'ERP',
    },
  },
];

export default erpRoutes;
