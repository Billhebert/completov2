/**
 * Auth Provider
 * Gerencia autenticação, usuário e permissões
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ROLE_HIERARCHY, ROLE_PERMISSIONS } from '../types';
import api, { setAuthToken, clearAuth } from '../utils/api';
import { STORAGE_KEYS } from '../utils/constants';

interface AuthContextData {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  isRoleHigherOrEqual: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar usuário do localStorage ao iniciar
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const storedUser = localStorage.getItem(STORAGE_KEYS.USER);

        if (token && storedUser) {
          setAuthToken(token);
          setUser(JSON.parse(storedUser));

          // Tentar atualizar dados do usuário
          try {
            await refreshUser();
          } catch (error) {
            // Se falhar, usa os dados do localStorage mesmo
            console.error('Failed to refresh user:', error);
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        clearAuth();
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  /**
   * Login
   */
  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = response.data.data;

      // Salvar tokens
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));

      setAuthToken(accessToken);
      setUser(userData);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  /**
   * Logout
   */
  const logout = () => {
    try {
      // Chamar endpoint de logout no backend (opcional, fire-and-forget)
      api.post('/auth/logout').catch(() => {
        // Ignora erros
      });
    } finally {
      clearAuth();
      localStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      window.location.href = '/login';
    }
  };

  /**
   * Atualizar dados do usuário
   */
  const refreshUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.data;

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      throw error;
    }
  };

  /**
   * Verificar se o usuário tem uma permissão específica
   */
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    // DEV e ADMIN_GERAL têm todas as permissões
    if (user.role === 'DEV' || user.role === 'ADMIN_GERAL') {
      return true;
    }

    // Verificar permissões do usuário
    if (user.permissions.includes('*')) {
      return true;
    }

    // Verificar permissão exata
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Verificar wildcard (ex: crm.* permite crm.read, crm.create, etc)
    const parts = permission.split('.');
    if (parts.length === 2) {
      const wildcardPermission = `${parts[0]}.*`;
      if (user.permissions.includes(wildcardPermission)) {
        return true;
      }
    }

    // Verificar permissões do role
    const rolePermissions = ROLE_PERMISSIONS[user.role] || [];
    if (rolePermissions.includes('*')) {
      return true;
    }
    if (rolePermissions.includes(permission)) {
      return true;
    }
    if (parts.length === 2) {
      const wildcardPermission = `${parts[0]}.*`;
      if (rolePermissions.includes(wildcardPermission)) {
        return true;
      }
    }

    return false;
  };

  /**
   * Verificar se o usuário tem um role específico
   */
  const hasRole = (role: UserRole): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  /**
   * Verificar se o usuário tem algum dos roles
   */
  const hasAnyRole = (roles: UserRole[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  /**
   * Verificar se o role do usuário é maior ou igual ao role especificado
   */
  const isRoleHigherOrEqual = (role: UserRole): boolean => {
    if (!user) return false;

    const userRoleIndex = ROLE_HIERARCHY.indexOf(user.role);
    const requiredRoleIndex = ROLE_HIERARCHY.indexOf(role);

    // Quanto menor o índice, maior o privilégio
    return userRoleIndex <= requiredRoleIndex;
  };

  const value: AuthContextData = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
    refreshUser,
    hasPermission,
    hasRole,
    hasAnyRole,
    isRoleHigherOrEqual,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
