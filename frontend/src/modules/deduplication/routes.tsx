/**
 * Deduplicação IA Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const DeduplicationListPage = lazy(() => import('./pages/DeduplicationListPage'));

export const deduplicationRoutes: ProtectedRouteConfig[] = [
  {
    path: '/deduplication',
    element: <DeduplicationListPage />,
    requiredPermissions: ['deduplication.read'],
    meta: {
      title: 'Deduplicação IA',
    },
  },
];

export default deduplicationRoutes;
