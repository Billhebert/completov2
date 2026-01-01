/**
 * Modular Router
 * Router principal que carrega rotas dinamicamente dos módulos
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect } from 'react';
import { ProtectedRoute } from './ProtectedRoute';
import { routeRegistry } from './RouteRegistry';
import { useModule } from '../providers/ModuleProvider';
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
 * Router modular principal
 */
export const ModularRouter: React.FC = () => {
  const { getEnabledModules } = useModule();

  // Registrar todas as rotas ao montar
  useEffect(() => {
    registerAllRoutes();
  }, []);

  // Obter todas as rotas dos módulos habilitados
  const enabledModules = getEnabledModules();
  const allRoutes = enabledModules.flatMap((module) => {
    return routeRegistry.getModuleRoutes(module.id);
  });

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Rota raiz - redireciona para dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* Renderizar rotas dinâmicas dos módulos */}
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
