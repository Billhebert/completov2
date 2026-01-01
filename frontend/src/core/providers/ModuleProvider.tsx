/**
 * Module Provider
 * Gerencia módulos habilitados e suas configurações
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ModuleConfig, ModuleContext, ModuleRegistry } from '../types';
import { modulesConfig, checkModuleDependencies } from '../config/modules.config';
import { useAuth } from './AuthProvider';
import { STORAGE_KEYS } from '../utils/constants';

const ModuleProviderContext = createContext<ModuleContext>({} as ModuleContext);

export const useModule = () => {
  const context = useContext(ModuleProviderContext);
  if (!context) {
    throw new Error('useModule must be used within a ModuleProvider');
  }
  return context;
};

interface ModuleProviderProps {
  children: React.ReactNode;
}

export const ModuleProvider: React.FC<ModuleProviderProps> = ({ children }) => {
  const { user, hasPermission } = useAuth();
  const [modules, setModules] = useState<ModuleRegistry>(() => {
    // Inicializar com configuração padrão
    const registry: ModuleRegistry = {};
    modulesConfig.forEach((module) => {
      registry[module.id] = module;
    });
    return registry;
  });

  // Carregar configuração personalizada de módulos do localStorage
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem(STORAGE_KEYS.MODULE_CONFIG);
      if (savedConfig) {
        const customConfig = JSON.parse(savedConfig) as Record<
          string,
          Partial<ModuleConfig>
        >;

        setModules((current) => {
          const updated = { ...current };
          Object.keys(customConfig).forEach((moduleId) => {
            if (updated[moduleId]) {
              updated[moduleId] = {
                ...updated[moduleId],
                ...customConfig[moduleId],
              };
            }
          });
          return updated;
        });
      }
    } catch (error) {
      console.error('Failed to load module config:', error);
    }
  }, []);

  /**
   * Registrar um módulo
   */
  const registerModule = (config: ModuleConfig) => {
    setModules((current) => ({
      ...current,
      [config.id]: config,
    }));
  };

  /**
   * Desregistrar um módulo
   */
  const unregisterModule = (moduleId: string) => {
    setModules((current) => {
      const updated = { ...current };
      delete updated[moduleId];
      return updated;
    });
  };

  /**
   * Habilitar/desabilitar módulo
   */
  const toggleModule = (moduleId: string, enabled: boolean) => {
    setModules((current) => {
      const updated = { ...current };
      if (updated[moduleId]) {
        updated[moduleId] = {
          ...updated[moduleId],
          enabled,
        };

        // Salvar no localStorage
        const config: Record<string, Partial<ModuleConfig>> = {};
        Object.values(updated).forEach((module) => {
          config[module.id] = {
            enabled: module.enabled,
          };
        });
        localStorage.setItem(STORAGE_KEYS.MODULE_CONFIG, JSON.stringify(config));
      }
      return updated;
    });
  };

  /**
   * Obter todos os módulos
   */
  const getAllModules = (): ModuleConfig[] => {
    return Object.values(modules);
  };

  /**
   * Obter módulos habilitados
   */
  const getEnabledModules = (): ModuleConfig[] => {
    return Object.values(modules).filter((module) => {
      // Verificar se está habilitado
      if (!module.enabled) return false;

      // Verificar dependências
      if (!checkModuleDependencies(module.id)) return false;

      // Verificar permissões do usuário
      if (!hasModulePermission(module.id)) return false;

      return true;
    });
  };

  /**
   * Verificar se módulo está habilitado
   */
  const isModuleEnabled = (moduleId: string): boolean => {
    const module = modules[moduleId];
    if (!module || !module.enabled) return false;

    // Verificar dependências
    if (!checkModuleDependencies(moduleId)) return false;

    // Verificar permissões
    if (!hasModulePermission(moduleId)) return false;

    return true;
  };

  /**
   * Verificar se usuário tem permissão para módulo
   */
  const hasModulePermission = (moduleId: string): boolean => {
    const module = modules[moduleId];
    if (!module) return false;

    // Se não há permissões requeridas, qualquer um pode acessar
    if (
      !module.requiredPermissions ||
      module.requiredPermissions.length === 0
    ) {
      return true;
    }

    // Se não está autenticado, não tem permissão
    if (!user) return false;

    // Verificar se tem ao menos uma das permissões requeridas
    return module.requiredPermissions.some((permission) =>
      hasPermission(permission)
    );
  };

  const value: ModuleContext = {
    config: modules[Object.keys(modules)[0]] || ({} as ModuleConfig), // Compatibilidade
    state: {
      loaded: true,
      initialized: true,
    },
    registerModule,
    unregisterModule,
    toggleModule,
    getAllModules,
    getEnabledModules,
    isModuleEnabled,
    hasModulePermission,
  };

  return (
    <ModuleProviderContext.Provider value={value}>
      {children}
    </ModuleProviderContext.Provider>
  );
};

export default ModuleProvider;
