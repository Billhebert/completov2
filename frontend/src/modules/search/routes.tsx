/**
 * Busca Global Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const SearchListPage = lazy(() => import('./pages/SearchListPage'));

export const searchRoutes: ProtectedRouteConfig[] = [
  {
    path: '/search',
    element: <SearchListPage />,
    requiredPermissions: [],
    meta: {
      title: 'Busca Global',
    },
  },
];

export default searchRoutes;
