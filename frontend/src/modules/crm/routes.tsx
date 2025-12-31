/**
 * CRM Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const CrmListPage = lazy(() => import('./pages/CrmListPage'));

export const crmRoutes: ProtectedRouteConfig[] = [
  {
    path: '/crm',
    element: <CrmListPage />,
    requiredPermissions: ['crm.read'],
    meta: {
      title: 'CRM',
    },
  },
];

export default crmRoutes;
