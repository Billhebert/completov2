/**
 * Chat Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const ChatListPage = lazy(() => import('./pages/ChatListPage'));

export const chatRoutes: ProtectedRouteConfig[] = [
  {
    path: '/chat',
    element: <ChatListPage />,
    requiredPermissions: ['chat.read'],
    meta: {
      title: 'Chat',
    },
  },
];

export default chatRoutes;
