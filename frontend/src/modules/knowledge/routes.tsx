/**
 * Base de Conhecimento Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const KnowledgeListPage = lazy(() => import('./pages/KnowledgeListPage'));

export const knowledgeRoutes: ProtectedRouteConfig[] = [
  {
    path: '/knowledge',
    element: <KnowledgeListPage />,
    requiredPermissions: ['knowledge.read'],
    meta: {
      title: 'Base de Conhecimento',
    },
  },
];

export default knowledgeRoutes;
