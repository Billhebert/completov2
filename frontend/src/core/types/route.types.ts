/**
 * Route System Types
 * Define os tipos para o sistema de rotas
 */

import { ReactNode } from 'react';
import { RouteObject } from 'react-router-dom';
import { UserRole } from './common.types';

/**
 * Rota protegida com permissões
 */
export type ProtectedRouteConfig = RouteObject & {
  /** Permissões necessárias para acessar a rota */
  requiredPermissions?: string[];
  /** Se requer autenticação */
  requiresAuth?: boolean;
  /** Roles necessários */
  requiredRoles?: UserRole[];
  /** Se é uma rota pública */
  isPublic?: boolean;
  /** Componente de fallback durante carregamento */
  fallback?: ReactNode;
  /** Metadata da rota */
  meta?: RouteMeta;
};

/**
 * Metadata da rota
 */
export interface RouteMeta {
  /** Título da página */
  title?: string;
  /** Descrição */
  description?: string;
  /** Se deve esconder a sidebar */
  hideSidebar?: boolean;
  /** Se deve esconder o topbar */
  hideTopbar?: boolean;
  /** Breadcrumbs */
  breadcrumbs?: Breadcrumb[];
  /** Classe CSS customizada para o container */
  containerClass?: string;
}

/**
 * Breadcrumb
 */
export interface Breadcrumb {
  /** Label */
  label: string;
  /** Path (opcional para o último item) */
  path?: string;
  /** Ícone */
  icon?: string;
}

/**
 * Configuração do registry de rotas
 */
export interface RouteRegistryConfig {
  /** Rotas registradas por módulo */
  moduleRoutes: Map<string, ProtectedRouteConfig[]>;
  /** Rotas públicas (não requerem autenticação) */
  publicRoutes: ProtectedRouteConfig[];
  /** Rotas protegidas (requerem autenticação) */
  protectedRoutes: ProtectedRouteConfig[];
  /** Rota padrão após login */
  defaultRoute: string;
  /** Rota de fallback (404) */
  notFoundRoute: string;
  /** Rota de acesso negado */
  unauthorizedRoute: string;
}

/**
 * Contexto de navegação
 */
export interface NavigationContext {
  /** Rota atual */
  currentRoute: string;
  /** Breadcrumbs da rota atual */
  breadcrumbs: Breadcrumb[];
  /** Navegar para uma rota */
  navigateTo: (path: string, state?: unknown) => void;
  /** Voltar */
  goBack: () => void;
  /** Verificar se pode acessar rota */
  canAccessRoute: (path: string) => boolean;
}
