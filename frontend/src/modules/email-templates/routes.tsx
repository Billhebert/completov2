/**
 * Templates de Email Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const EmailTemplatesListPage = lazy(() => import('./pages/EmailTemplatesListPage'));

export const emailtemplatesRoutes: ProtectedRouteConfig[] = [
  {
    path: '/email-templates',
    element: <EmailTemplatesListPage />,
    requiredPermissions: ['email-templates.read'],
    meta: {
      title: 'Templates de Email',
    },
  },
];

export default emailtemplatesRoutes;
