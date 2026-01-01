/**
 * Route Registry
 * Sistema de registro dinâmico de rotas por módulo
 */

import { RouteObject } from 'react-router-dom';
import { ProtectedRouteConfig } from '../types';

/**
 * Registry de rotas por módulo
 */
class RouteRegistry {
  private routes: Map<string, ProtectedRouteConfig[]> = new Map();
  private publicRoutes: ProtectedRouteConfig[] = [];
  private protectedRoutes: ProtectedRouteConfig[] = [];

  /**
   * Registrar rotas de um módulo
   */
  registerModuleRoutes(moduleId: string, routes: ProtectedRouteConfig[]): void {
    this.routes.set(moduleId, routes);
    this.updateRoutes();
  }

  /**
   * Desregistrar rotas de um módulo
   */
  unregisterModuleRoutes(moduleId: string): void {
    this.routes.delete(moduleId);
    this.updateRoutes();
  }

  /**
   * Atualizar rotas públicas e protegidas
   */
  private updateRoutes(): void {
    this.publicRoutes = [];
    this.protectedRoutes = [];

    this.routes.forEach((moduleRoutes) => {
      moduleRoutes.forEach((route) => {
        if (route.isPublic) {
          this.publicRoutes.push(route);
        } else {
          this.protectedRoutes.push(route);
        }
      });
    });
  }

  /**
   * Obter todas as rotas de um módulo
   */
  getModuleRoutes(moduleId: string): ProtectedRouteConfig[] {
    return this.routes.get(moduleId) || [];
  }

  /**
   * Obter todas as rotas públicas
   */
  getPublicRoutes(): ProtectedRouteConfig[] {
    return this.publicRoutes;
  }

  /**
   * Obter todas as rotas protegidas
   */
  getProtectedRoutes(): ProtectedRouteConfig[] {
    return this.protectedRoutes;
  }

  /**
   * Obter todas as rotas (combinadas)
   */
  getAllRoutes(): RouteObject[] {
    const allRoutes: RouteObject[] = [];
    this.routes.forEach((routes) => {
      allRoutes.push(...routes);
    });
    return allRoutes;
  }

  /**
   * Limpar todas as rotas
   */
  clear(): void {
    this.routes.clear();
    this.publicRoutes = [];
    this.protectedRoutes = [];
  }

  /**
   * Verificar se uma rota está registrada
   */
  hasRoute(path: string): boolean {
    for (const routes of this.routes.values()) {
      if (routes.some((route) => route.path === path)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Obter configuração de uma rota por path
   */
  getRouteConfig(path: string): ProtectedRouteConfig | undefined {
    for (const routes of this.routes.values()) {
      const route = routes.find((r) => r.path === path);
      if (route) {
        return route;
      }
    }
    return undefined;
  }

  /**
   * Obter módulos com rotas registradas
   */
  getRegisteredModules(): string[] {
    return Array.from(this.routes.keys());
  }
}

// Singleton instance
export const routeRegistry = new RouteRegistry();

export default routeRegistry;
