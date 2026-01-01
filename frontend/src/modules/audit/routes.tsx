/**
 * Auditoria Module Routes
 */
import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const AuditListPage = lazy(() => import('./pages/AuditListPage'));

export const auditRoutes: ProtectedRouteConfig[] = [
  {
    path: '/audit',
    element: <AuditListPage />,
    requiredPermissions: ['audit.read'],
    meta: {
      title: 'Auditoria',
    },
  },
];

export default auditRoutes;
