import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, isLoading, login, register, logout, checkAuth, error, clearError, _hasHydrated } = useAuthStore();

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    checkAuth,
    error,
    clearError,
    _hasHydrated,
  };
};

export const useRequireAuth = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { isAuthenticated, isLoading };
};
