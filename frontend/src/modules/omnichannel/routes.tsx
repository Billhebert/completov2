/**
 * Omnichannel Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const OmnichannelListPage = lazy(() => import('./pages/OmnichannelListPage'));

export const omnichannelRoutes: ProtectedRouteConfig[] = [
  {
    path: '/omnichannel',
    element: <OmnichannelListPage />,
    requiredPermissions: ['omnichannel.read'],
    meta: {
      title: 'Omnichannel',
    },
  },
];

export default omnichannelRoutes;
