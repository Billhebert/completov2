/**
 * Feedback Module Routes
 */

import { lazy } from 'react';
import type { ProtectedRouteConfig } from '../../core/types/route.types';

const FeedbackListPage = lazy(() => import('./pages/FeedbackListPage'));
const FeedbackFormPage = lazy(() => import('./pages/FeedbackFormPage'));

export const feedbackRoutes: ProtectedRouteConfig[] = [
  {
    path: '/feedback',
    element: <FeedbackListPage />,
    permissions: [],
  },
  {
    path: '/feedback/new',
    element: <FeedbackFormPage />,
    permissions: [],
  },
];

export default feedbackRoutes;
