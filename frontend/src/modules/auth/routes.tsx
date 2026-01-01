/**
 * Auth Module Routes
 */

import { lazy } from 'react';
import { ProtectedRouteConfig } from '../../core/types';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));

/**
 * Rotas do módulo de autenticação
 */
export const authRoutes: ProtectedRouteConfig[] = [
  {
    path: '/login',
    element: <LoginPage />,
    isPublic: true,
    meta: {
      title: 'Login',
      hideSidebar: true,
      hideTopbar: true,
    },
  },
  {
    path: '/register',
    element: <RegisterPage />,
    isPublic: true,
    meta: {
      title: 'Cadastro',
      hideSidebar: true,
      hideTopbar: true,
    },
  },
  {
    path: '/forgot-password',
    element: <ForgotPasswordPage />,
    isPublic: true,
    meta: {
      title: 'Esqueci minha senha',
      hideSidebar: true,
      hideTopbar: true,
    },
  },
];

export default authRoutes;
