/**
 * Webhooks Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const WebhooksListPage = lazy(() => import('./pages/WebhooksListPage'));

export const webhooksRoutes: ProtectedRouteConfig[] = [
  {
    path: '/webhooks',
    element: <WebhooksListPage />,
    requiredPermissions: ['webhooks.read'],
    meta: {
      title: 'Webhooks',
    },
  },
];

export default webhooksRoutes;
