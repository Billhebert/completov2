/**
 * IA Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const AiHubPage = lazy(() => import('./pages/AiHubPage'));

export const aiRoutes: ProtectedRouteConfig[] = [
  {
    path: '/ai',
    element: <AiHubPage />,
    requiredPermissions: ['ai.read'],
    meta: {
      title: 'IA',
    },
  },
];

export default aiRoutes;
