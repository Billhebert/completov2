/**
 * Serviços Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const ServicesListPage = lazy(() => import('./pages/ServicesListPage'));

export const servicesRoutes: ProtectedRouteConfig[] = [
  {
    path: '/services',
    element: <ServicesListPage />,
    requiredPermissions: ['services.read'],
    meta: {
      title: 'Serviços',
    },
  },
];

export default servicesRoutes;
