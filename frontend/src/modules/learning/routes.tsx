/**
 * Aprendizado Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const LearningListPage = lazy(() => import('./pages/LearningListPage'));

export const learningRoutes: ProtectedRouteConfig[] = [
  {
    path: '/learning',
    element: <LearningListPage />,
    requiredPermissions: ['learning.read'],
    meta: {
      title: 'Aprendizado',
    },
  },
];

export default learningRoutes;
