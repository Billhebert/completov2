/**
 * Modular Router
 * Router principal que carrega rotas dinamicamente dos módulos
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { routeRegistry } from './RouteRegistry';
import { useModule } from '../providers/ModuleProvider';
import { useAuth } from '../providers/AuthProvider';
import registerAllRoutes from './registerAllRoutes';

// Lazy load de páginas especiais
const NotFoundPage = lazy(() => import('../../pages/NotFound'));
const UnauthorizedPage = lazy(() => import('../../pages/Unauthorized'));

// Loading fallback
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
);

/**
 * Componente para rota raiz que redireciona baseado em autenticação
 */
const RootRedirect = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingFallback />;
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

/**
 * Router modular principal
 */
export const ModularRouter: React.FC = () => {
  const { getEnabledModules } = useModule();

  // Registrar todas as rotas ao montar
  useEffect(() => {
    registerAllRoutes();
  }, []);

  // IDs de módulos que não aparecem em modules.config.ts,
  // mas que precisam ser sempre registrados (dashboard, perfil, etc.)
  const staticModuleIds = ['dashboard', 'profile', 'settings-page'];

  // IDs de módulos dinâmicos (habilitados via ModuleProvider)
  const enabledModules = getEnabledModules();
  const dynamicModuleIds = enabledModules.map((module) => module.id);

  // Combina e remove duplicatas
  const moduleIds = Array.from(new Set([...staticModuleIds, ...dynamicModuleIds]));

  // Obter rotas de todos os módulos selecionados
  const allRoutes = moduleIds.flatMap((moduleId) =>
    routeRegistry.getModuleRoutes(moduleId)
  );

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Rota raiz - redireciona baseado em autenticação */}
        <Route path="/" element={<RootRedirect />} />

        {/* Renderizar rotas dinâmicas dos módulos e páginas estáticas */}
        {allRoutes.map((routeConfig, index) => {
          const { path, element, isPublic, ...config } = routeConfig;

          if (isPublic) {
            // Rota pública - não requer autenticação
            return <Route key={`${path}-${index}`} path={path} element={element} />;
          } else {
            // Rota protegida
            return (
              <Route
                key={`${path}-${index}`}
                path={path}
                element={
                  <ProtectedRoute config={config}>
                    {element}
                  </ProtectedRoute>
                }
              />
            );
          }
        })}

        {/* Rotas especiais */}
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
};

export default ModularRouter;
