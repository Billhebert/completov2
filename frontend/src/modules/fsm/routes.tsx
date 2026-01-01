/**
 * Field Service Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const FsmListPage = lazy(() => import('./pages/FsmListPage'));

export const fsmRoutes: ProtectedRouteConfig[] = [
  {
    path: '/fsm',
    element: <FsmListPage />,
    requiredPermissions: ['fsm.read'],
    meta: {
      title: 'Field Service',
    },
  },
];

export default fsmRoutes;
