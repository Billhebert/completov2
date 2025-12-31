/**
 * Analytics Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const AnalyticsListPage = lazy(() => import('./pages/AnalyticsListPage'));

export const analyticsRoutes: ProtectedRouteConfig[] = [
  {
    path: '/analytics',
    element: <AnalyticsListPage />,
    requiredPermissions: ['analytics.read'],
    meta: {
      title: 'Analytics',
    },
  },
];

export default analyticsRoutes;
