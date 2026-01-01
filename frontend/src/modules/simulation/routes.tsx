/**
 * Simulações Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const SimulationListPage = lazy(() => import('./pages/SimulationListPage'));

export const simulationRoutes: ProtectedRouteConfig[] = [
  {
    path: '/simulation',
    element: <SimulationListPage />,
    requiredPermissions: ['simulation.read'],
    meta: {
      title: 'Simulações',
    },
  },
];

export default simulationRoutes;
