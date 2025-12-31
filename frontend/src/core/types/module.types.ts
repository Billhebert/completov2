/**
 * Module System Types
 * Define os tipos para o sistema modular
 */

import { ReactNode } from 'react';
import { RouteObject } from 'react-router-dom';

/**
 * Configuração de um módulo
 */
export interface ModuleConfig {
  /** ID único do módulo */
  id: string;
  /** Nome de exibição */
  name: string;
  /** Descrição do módulo */
  description: string;
  /** Versão do módulo */
  version: string;
  /** Se o módulo está habilitado */
  enabled: boolean;
  /** Ícone do módulo (nome do ícone Heroicons) */
  icon?: string;
  /** Cor principal do módulo */
  color?: string;
  /** Ordem de exibição no menu */
  order?: number;
  /** Módulos dos quais este depende */
  dependencies?: string[];
  /** Permissões necessárias para acessar o módulo */
  requiredPermissions?: string[];
  /** Rotas do módulo */
  routes?: RouteObject[];
  /** Componente de navegação customizado */
  navComponent?: ReactNode;
  /** Se o módulo deve aparecer no menu principal */
  showInMenu?: boolean;
  /** Categoria do módulo */
  category?: 'business' | 'operations' | 'ai' | 'infrastructure' | 'erp' | 'hr' | 'specialized' | 'core';
  /** Configurações específicas do módulo */
  settings?: Record<string, unknown>;
}

/**
 * Estado de um módulo
 */
export interface ModuleState {
  /** Se o módulo foi carregado */
  loaded: boolean;
  /** Se o módulo está inicializado */
  initialized: boolean;
  /** Erros de carregamento */
  error?: string;
  /** Timestamp do último carregamento */
  lastLoaded?: Date;
}

/**
 * Contexto do módulo
 */
export interface ModuleContext {
  /** Configuração do módulo */
  config: ModuleConfig;
  /** Estado do módulo */
  state: ModuleState;
  /** Registrar um módulo */
  registerModule: (config: ModuleConfig) => void;
  /** Desregistrar um módulo */
  unregisterModule: (moduleId: string) => void;
  /** Habilitar/desabilitar módulo */
  toggleModule: (moduleId: string, enabled: boolean) => void;
  /** Obter todos os módulos */
  getAllModules: () => ModuleConfig[];
  /** Obter módulos habilitados */
  getEnabledModules: () => ModuleConfig[];
  /** Verificar se módulo está habilitado */
  isModuleEnabled: (moduleId: string) => boolean;
  /** Verificar se usuário tem permissão para módulo */
  hasModulePermission: (moduleId: string) => boolean;
}

/**
 * Registro de módulo
 */
export interface ModuleRegistry {
  [moduleId: string]: ModuleConfig;
}

/**
 * Hook de ciclo de vida do módulo
 */
export interface ModuleLifecycleHooks {
  /** Executado quando o módulo é montado */
  onMount?: () => void | Promise<void>;
  /** Executado quando o módulo é desmontado */
  onUnmount?: () => void | Promise<void>;
  /** Executado quando o módulo é habilitado */
  onEnable?: () => void | Promise<void>;
  /** Executado quando o módulo é desabilitado */
  onDisable?: () => void | Promise<void>;
}

/**
 * Item de navegação do módulo
 */
export interface ModuleNavItem {
  /** ID do item */
  id: string;
  /** Label */
  label: string;
  /** Path */
  path: string;
  /** Ícone */
  icon?: string;
  /** Sub-items */
  children?: ModuleNavItem[];
  /** Permissões necessárias */
  requiredPermissions?: string[];
  /** Badge (contador, etc) */
  badge?: string | number;
}
