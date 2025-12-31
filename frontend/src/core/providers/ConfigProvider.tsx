/**
 * Config Provider
 * Gerencia configurações globais do sistema
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { SystemConfig } from '../types';
import { API_CONFIG } from '../utils/constants';

interface ConfigContextData {
  config: SystemConfig;
  updateConfig: (updates: Partial<SystemConfig>) => void;
  isFeatureEnabled: (feature: string) => boolean;
}

const ConfigContext = createContext<ConfigContextData>({} as ConfigContextData);

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};

interface ConfigProviderProps {
  children: React.ReactNode;
}

/**
 * Configuração padrão do sistema
 */
const defaultConfig: SystemConfig = {
  appName: 'Completov2',
  appVersion: '2.0.0',
  apiUrl: API_CONFIG.BASE_URL,
  wsUrl: API_CONFIG.WS_URL,
  environment: (import.meta.env.VITE_ENV as SystemConfig['environment']) || 'development',
  features: {
    // Features toggle
    enableAI: true,
    enableRAG: true,
    enableOmnichannel: true,
    enableAnalytics: true,
    enableWorkflows: true,
    enableKnowledgeGraph: true,
    enableTwoFactor: true,
    enableSSO: true,
    enableWebhooks: true,
    enableFileStorage: true,
    enableNotifications: true,
    enableAuditLogs: true,
    enableDeduplication: true,
    enableNarrative: true,
    enableGatekeeper: true,
  },
  limits: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFilesPerUpload: 10,
    sessionTimeout: 30 * 60 * 1000, // 30 minutos
  },
};

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<SystemConfig>(defaultConfig);

  // Carregar configurações do servidor (opcional)
  useEffect(() => {
    const loadServerConfig = async () => {
      try {
        // Aqui você pode buscar configurações do servidor
        // const response = await api.get('/config');
        // setConfig((current) => ({ ...current, ...response.data.data }));
      } catch (error) {
        console.error('Failed to load server config:', error);
      }
    };

    loadServerConfig();
  }, []);

  /**
   * Atualizar configurações
   */
  const updateConfig = (updates: Partial<SystemConfig>) => {
    setConfig((current) => ({
      ...current,
      ...updates,
      features: {
        ...current.features,
        ...(updates.features || {}),
      },
      limits: {
        ...current.limits,
        ...(updates.limits || {}),
      },
    }));
  };

  /**
   * Verificar se uma feature está habilitada
   */
  const isFeatureEnabled = (feature: string): boolean => {
    return config.features[feature] === true;
  };

  const value: ConfigContextData = {
    config,
    updateConfig,
    isFeatureEnabled,
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
};

export default ConfigProvider;
