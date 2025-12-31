/**
 * Narrativas IA Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const NarrativeListPage = lazy(() => import('./pages/NarrativeListPage'));

export const narrativeRoutes: ProtectedRouteConfig[] = [
  {
    path: '/narrative',
    element: <NarrativeListPage />,
    requiredPermissions: ['narrative.read'],
    meta: {
      title: 'Narrativas IA',
    },
  },
];

export default narrativeRoutes;
