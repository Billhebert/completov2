/**
 * MCP Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const McpListPage = lazy(() => import('./pages/McpListPage'));

export const mcpRoutes: ProtectedRouteConfig[] = [
  {
    path: '/mcp',
    element: <McpListPage />,
    requiredPermissions: ['mcp.read'],
    meta: {
      title: 'MCP',
    },
  },
];

export default mcpRoutes;
