/**
 * API Keys Module Routes
 */
import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const ApikeysListPage = lazy(() => import('./pages/ApikeysListPage'));

export const apikeysRoutes: ProtectedRouteConfig[] = [
  {
    path: '/apikeys',
    element: <ApikeysListPage />,
    requiredPermissions: ['apikeys.read'],
    meta: {
      title: 'API Keys',
    },
  },
];

export default apikeysRoutes;
