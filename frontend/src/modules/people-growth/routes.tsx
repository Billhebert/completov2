/**
 * Crescimento Pessoal Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const PeopleGrowthListPage = lazy(() => import('./pages/PeopleGrowthListPage'));

export const peoplegrowthRoutes: ProtectedRouteConfig[] = [
  {
    path: '/people-growth',
    element: <PeopleGrowthListPage />,
    requiredPermissions: ['people-growth.read'],
    meta: {
      title: 'Crescimento Pessoal',
    },
  },
];

export default peoplegrowthRoutes;
