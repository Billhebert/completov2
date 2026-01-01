/**
 * IA Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const AiListPage = lazy(() => import('./pages/AiListPage'));

export const aiRoutes: ProtectedRouteConfig[] = [
  {
    path: '/ai',
    element: <AiListPage />,
    requiredPermissions: ['ai.read'],
    meta: {
      title: 'IA',
    },
  },
];

export default aiRoutes;
