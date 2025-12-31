/**
 * Notificações Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const NotificationsListPage = lazy(() => import('./pages/NotificationsListPage'));

export const notificationsRoutes: ProtectedRouteConfig[] = [
  {
    path: '/notifications',
    element: <NotificationsListPage />,
    requiredPermissions: [],
    meta: {
      title: 'Notificações',
    },
  },
];

export default notificationsRoutes;
