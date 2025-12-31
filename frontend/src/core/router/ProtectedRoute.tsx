/**
 * Protected Route Component
 * Componente para proteção de rotas com autenticação e permissões
 */

import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../providers/AuthProvider';
import { ProtectedRouteConfig } from '../types';

interface ProtectedRouteProps {
  config?: ProtectedRouteConfig;
  children?: React.ReactNode;
}

/**
 * Componente de rota protegida
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  config,
  children,
}) => {
  const { isAuthenticated, user, hasPermission, hasRole } = useAuth();

  // Se requer autenticação e não está autenticado
  if (config?.requiresAuth !== false && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar roles necessários
  if (config?.requiredRoles && config.requiredRoles.length > 0) {
    const hasRequiredRole = config.requiredRoles.some((role) =>
      hasRole(role)
    );
    if (!hasRequiredRole) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Verificar permissões necessárias
  if (config?.requiredPermissions && config.requiredPermissions.length > 0) {
    const hasRequiredPermissions = config.requiredPermissions.every(
      (permission) => hasPermission(permission)
    );
    if (!hasRequiredPermissions) {
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Se passou em todas as verificações, renderiza o conteúdo
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
