/**
 * Vagas Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const JobsListPage = lazy(() => import('./pages/JobsListPage'));

export const jobsRoutes: ProtectedRouteConfig[] = [
  {
    path: '/jobs',
    element: <JobsListPage />,
    requiredPermissions: ['jobs.read'],
    meta: {
      title: 'Vagas',
    },
  },
];

export default jobsRoutes;
