/**
 * Arquivos Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const FilesListPage = lazy(() => import('./pages/FilesListPage'));

export const filesRoutes: ProtectedRouteConfig[] = [
  {
    path: '/files',
    element: <FilesListPage />,
    requiredPermissions: ['files.read'],
    meta: {
      title: 'Arquivos',
    },
  },
];

export default filesRoutes;
