/**
 * Configurações Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const SettingsListPage = lazy(() => import('./pages/SettingsListPage'));

export const settingsRoutes: ProtectedRouteConfig[] = [
  {
    path: '/settings',
    element: <SettingsListPage />,
    requiredPermissions: [],
    meta: {
      title: 'Configurações',
    },
  },
];

export default settingsRoutes;
