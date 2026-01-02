/**
 * Module Configuration
 * Define todos os módulos disponíveis no sistema
 */

import { ModuleConfig } from '../types';

/**
 * Configuração de todos os módulos
 * Cada módulo pode ser habilitado/desabilitado aqui
 */
export const modulesConfig: ModuleConfig[] = [
  // ========================================
  // CORE MODULES
  // ========================================
  {
    id: 'auth',
    name: 'Autenticação',
    description: 'Sistema de autenticação, login, 2FA e gerenciamento de sessões',
    version: '1.0.0',
    enabled: true,
    icon: 'ShieldCheckIcon',
    color: '#3b82f6',
    order: 1,
    category: 'core',
    showInMenu: false,
    dependencies: [],
  },

  // ========================================
  // BUSINESS MODULES
  // ========================================
  {
    id: 'crm',
    name: 'CRM',
    description: 'Gestão de contatos, empresas, deals e pipeline de vendas',
    version: '1.0.0',
    enabled: true,
    icon: 'UserGroupIcon',
    color: '#10b981',
    order: 10,
    category: 'business',
    showInMenu: true,
    dependencies: ['auth', 'rbac'],
    requiredPermissions: ['crm.read'],
  },
  {
    id: 'chat',
    name: 'Chat',
    description: 'Sistema de mensagens em tempo real com canais e mensagens diretas',
    version: '1.0.0',
    enabled: true,
    icon: 'ChatBubbleLeftRightIcon',
    color: '#10b981',
    order: 11,
    category: 'business',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['chat.read'],
  },
  {
    id: 'knowledge',
    name: 'Base de Conhecimento',
    description: 'Sistema Zettelkasten com RAG e busca semântica',
    version: '1.0.0',
    enabled: true,
    icon: 'BookOpenIcon',
    color: '#10b981',
    order: 12,
    category: 'business',
    showInMenu: true,
    dependencies: ['auth', 'ai'],
    requiredPermissions: ['knowledge.read'],
  },

  // ========================================
  // AI MODULES
  // ========================================
  {
    id: 'ai',
    name: 'IA',
    description: 'Integração com LLMs (OpenAI + Ollama), 3 modos de operação',
    version: '1.0.0',
    enabled: true,
    icon: 'CpuChipIcon',
    color: '#8b5cf6',
    order: 20,
    category: 'ai',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['ai.read'],
  },
  {
    id: 'automations',
    name: 'Automações',
    description: 'Editor de workflows visual com triggers e ações',
    version: '1.0.0',
    enabled: true,
    icon: 'BoltIcon',
    color: '#8b5cf6',
    order: 21,
    category: 'ai',
    showInMenu: true,
    dependencies: ['auth', 'rbac'],
    requiredPermissions: ['automations.read'],
  },
  {
    id: 'narrative',
    name: 'Narrativas IA',
    description: 'Geração de narrativas com IA baseadas em dados',
    version: '1.0.0',
    enabled: true,
    icon: 'DocumentTextIcon',
    color: '#8b5cf6',
    order: 22,
    category: 'ai',
    showInMenu: true,
    dependencies: ['auth', 'ai'],
    requiredPermissions: ['narrative.read'],
  },
  {
    id: 'deduplication',
    name: 'Deduplicação IA',
    description: 'Detecção inteligente de duplicatas com IA',
    version: '1.0.0',
    enabled: true,
    icon: 'DocumentDuplicateIcon',
    color: '#8b5cf6',
    order: 23,
    category: 'ai',
    showInMenu: false,
    dependencies: ['auth', 'ai'],
    requiredPermissions: ['deduplication.read'],
  },
  {
    id: 'gatekeeper',
    name: 'Gatekeeper',
    description: 'Sistema de gerenciamento de atenção com IA',
    version: '1.0.0',
    enabled: true,
    icon: 'EyeIcon',
    color: '#8b5cf6',
    order: 24,
    category: 'ai',
    showInMenu: false,
    dependencies: ['auth', 'ai'],
    requiredPermissions: ['gatekeeper.read'],
  },

  // ========================================
  // OPERATIONS MODULES
  // ========================================
  {
    id: 'omnichannel',
    name: 'Omnichannel',
    description: 'Atendimento multicanal (WhatsApp, Email, Telegram, etc)',
    version: '1.0.0',
    enabled: true,
    icon: 'PhoneIcon',
    color: '#f59e0b',
    order: 30,
    category: 'operations',
    showInMenu: true,
    dependencies: ['auth', 'crm'],
    requiredPermissions: ['omnichannel.read'],
  },
  {
    id: 'analytics',
    name: 'Analytics',
    description: 'Business intelligence e relatórios avançados',
    version: '1.0.0',
    enabled: true,
    icon: 'ChartBarIcon',
    color: '#f59e0b',
    order: 31,
    category: 'operations',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['analytics.read'],
  },
  {
    id: 'notifications',
    name: 'Notificações',
    description: 'Sistema de notificações multicanal com preferências',
    version: '1.0.0',
    enabled: true,
    icon: 'BellIcon',
    color: '#f59e0b',
    order: 32,
    category: 'operations',
    showInMenu: false,
    dependencies: ['auth'],
    requiredPermissions: [],
  },

  // ========================================
  // INFRASTRUCTURE MODULES
  // ========================================
  {
    id: 'rbac',
    name: 'RBAC',
    description: 'Controle de acesso baseado em roles e permissões',
    version: '1.0.0',
    enabled: true,
    icon: 'KeyIcon',
    color: '#6b7280',
    order: 40,
    category: 'infrastructure',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['rbac.read'],
  },
  {
    id: 'webhooks',
    name: 'Webhooks',
    description: 'Gestão de webhooks para eventos do sistema',
    version: '1.0.0',
    enabled: true,
    icon: 'ArrowPathIcon',
    color: '#6b7280',
    order: 41,
    category: 'infrastructure',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['webhooks.read'],
  },
  {
    id: 'files',
    name: 'Arquivos',
    description: 'Gerenciamento de arquivos com S3 e MinIO',
    version: '1.0.0',
    enabled: true,
    icon: 'FolderIcon',
    color: '#6b7280',
    order: 42,
    category: 'infrastructure',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['files.read'],
  },
  {
    id: 'search',
    name: 'Busca Global',
    description: 'Sistema de busca global cross-module',
    version: '1.0.0',
    enabled: true,
    icon: 'MagnifyingGlassIcon',
    color: '#6b7280',
    order: 43,
    category: 'infrastructure',
    showInMenu: false,
    dependencies: ['auth'],
    requiredPermissions: [],
  },
  {
    id: 'audit',
    name: 'Auditoria',
    description: 'Logs de auditoria e compliance',
    version: '1.0.0',
    enabled: true,
    icon: 'DocumentTextIcon',
    color: '#6b7280',
    order: 44,
    category: 'infrastructure',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['audit.read'],
  },
  {
    id: 'apikeys',
    name: 'API Keys',
    description: 'Gerenciamento de chaves de API para integrações',
    version: '1.0.0',
    enabled: true,
    icon: 'KeyIcon',
    color: '#6b7280',
    order: 45,
    category: 'infrastructure',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['apikeys.read'],
  },
  {
    id: 'sync',
    name: 'Sincronização',
    description: 'Integração com sistemas terceiros',
    version: '1.0.0',
    enabled: true,
    icon: 'ArrowsRightLeftIcon',
    color: '#6b7280',
    order: 46,
    category: 'infrastructure',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['sync.read'],
  },
  {
    id: 'sso',
    name: 'SSO',
    description: 'Single Sign-On com OAuth',
    version: '1.0.0',
    enabled: true,
    icon: 'UserCircleIcon',
    color: '#6b7280',
    order: 47,
    category: 'infrastructure',
    showInMenu: false,
    dependencies: ['auth'],
    requiredPermissions: [],
  },
  {
    id: 'mcp',
    name: 'MCP',
    description: 'Model Context Protocol para IA',
    version: '1.0.0',
    enabled: true,
    icon: 'ServerIcon',
    color: '#6b7280',
    order: 48,
    category: 'infrastructure',
    showInMenu: false,
    dependencies: ['auth', 'ai'],
    requiredPermissions: ['mcp.read'],
  },

  // ========================================
  // ERP MODULES
  // ========================================
  {
    id: 'erp',
    name: 'ERP',
    description: 'Gestão financeira, faturas e despesas',
    version: '1.0.0',
    enabled: true,
    icon: 'CurrencyDollarIcon',
    color: '#ef4444',
    order: 50,
    category: 'erp',
    showInMenu: true,
    dependencies: ['auth', 'rbac'],
    requiredPermissions: ['erp.read'],
  },
  {
    id: 'services',
    name: 'Serviços',
    description: 'Marketplace de serviços e propostas',
    version: '1.0.0',
    enabled: true,
    icon: 'ShoppingCartIcon',
    color: '#ef4444',
    order: 51,
    category: 'erp',
    showInMenu: true,
    dependencies: ['auth', 'crm'],
    requiredPermissions: ['services.read'],
  },
  {
    id: 'partnerships',
    name: 'Parcerias',
    description: 'Gestão de parcerias B2B',
    version: '1.0.0',
    enabled: true,
    icon: 'HandshakeIcon',
    color: '#ef4444',
    order: 52,
    category: 'erp',
    showInMenu: true,
    dependencies: ['auth', 'crm'],
    requiredPermissions: ['partnerships.read'],
  },

  // ========================================
  // HR MODULES
  // ========================================
  {
    id: 'people-growth',
    name: 'Crescimento Pessoal',
    description: 'Planos de desenvolvimento individual',
    version: '1.0.0',
    enabled: true,
    icon: 'AcademicCapIcon',
    color: '#ec4899',
    order: 60,
    category: 'hr',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['people-growth.read'],
  },
  {
    id: 'jobs',
    name: 'Vagas',
    description: 'Recrutamento e seleção',
    version: '1.0.0',
    enabled: true,
    icon: 'BriefcaseIcon',
    color: '#ec4899',
    order: 61,
    category: 'hr',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['jobs.read'],
  },
  {
    id: 'learning',
    name: 'Aprendizado',
    description: 'Trilhas de aprendizado e desenvolvimento de skills',
    version: '1.0.0',
    enabled: true,
    icon: 'BookOpenIcon',
    color: '#ec4899',
    order: 62,
    category: 'hr',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['learning.read'],
  },

  // ========================================
  // SPECIALIZED MODULES
  // ========================================
  {
    id: 'fsm',
    name: 'Field Service',
    description: 'Gestão de serviços em campo',
    version: '1.0.0',
    enabled: true,
    icon: 'MapPinIcon',
    color: '#06b6d4',
    order: 70,
    category: 'specialized',
    showInMenu: true,
    dependencies: ['auth', 'crm'],
    requiredPermissions: ['fsm.read'],
  },
  {
    id: 'cmms',
    name: 'CMMS',
    description: 'Gestão de ativos e manutenção',
    version: '1.0.0',
    enabled: true,
    icon: 'WrenchIcon',
    color: '#06b6d4',
    order: 71,
    category: 'specialized',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['cmms.read'],
  },
  {
    id: 'simulation',
    name: 'Simulações',
    description: 'Simulações de treinamento',
    version: '1.0.0',
    enabled: true,
    icon: 'BeakerIcon',
    color: '#06b6d4',
    order: 72,
    category: 'specialized',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['simulation.read'],
  },
  {
    id: 'email-templates',
    name: 'Templates de Email',
    description: 'Gestão de templates de email',
    version: '1.0.0',
    enabled: true,
    icon: 'EnvelopeIcon',
    color: '#06b6d4',
    order: 73,
    category: 'specialized',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: ['email-templates.read'],
  },

  // ========================================
  // FEEDBACK & SETTINGS
  // ========================================
  {
    id: 'feedback',
    name: 'Feedback',
    description: 'Sistema de feedback e suporte',
    version: '1.0.0',
    enabled: true,
    icon: 'ChatBubbleLeftRightIcon',
    color: '#6b7280',
    order: 99,
    category: 'core',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: [],
  },
  {
    id: 'settings',
    name: 'Configurações',
    description: 'Configurações gerais do sistema',
    version: '1.0.0',
    enabled: true,
    icon: 'CogIcon',
    color: '#6b7280',
    order: 100,
    category: 'core',
    showInMenu: true,
    dependencies: ['auth'],
    requiredPermissions: [],
  },
];

/**
 * Obter módulo por ID
 */
export const getModuleById = (moduleId: string): ModuleConfig | undefined => {
  return modulesConfig.find((m) => m.id === moduleId);
};

/**
 * Obter módulos habilitados
 */
export const getEnabledModules = (): ModuleConfig[] => {
  return modulesConfig.filter((m) => m.enabled);
};

/**
 * Obter módulos por categoria
 */
export const getModulesByCategory = (
  category: ModuleConfig['category']
): ModuleConfig[] => {
  return modulesConfig.filter((m) => m.category === category && m.enabled);
};

/**
 * Obter módulos para menu
 */
export const getMenuModules = (): ModuleConfig[] => {
  return modulesConfig
    .filter((m) => m.enabled && m.showInMenu)
    .sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * Verificar dependências de um módulo
 */
export const checkModuleDependencies = (moduleId: string): boolean => {
  const module = getModuleById(moduleId);
  if (!module) return false;

  if (!module.dependencies || module.dependencies.length === 0) {
    return true;
  }

  return module.dependencies.every((depId) => {
    const dep = getModuleById(depId);
    return dep?.enabled === true;
  });
};
