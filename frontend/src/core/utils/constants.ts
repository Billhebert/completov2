/**
 * Application Constants
 */

import { UserRole } from '../types';

/**
 * URLs da API
 */
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  WS_URL: import.meta.env.VITE_WS_URL || 'ws://localhost:3000',
  API_VERSION: 'v1',
  TIMEOUT: 30000,
} as const;

/**
 * Rotas da aplicação
 */
export const ROUTES = {
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  TWO_FACTOR: '/2fa',

  // Dashboard
  DASHBOARD: '/dashboard',

  // CRM
  CRM_CONTACTS: '/crm/contacts',
  CRM_COMPANIES: '/crm/companies',
  CRM_DEALS: '/crm/deals',
  CRM_PIPELINE: '/crm/pipeline',

  // Chat
  CHAT: '/chat',

  // Knowledge
  KNOWLEDGE: '/knowledge',
  KNOWLEDGE_GRAPH: '/knowledge/graph',

  // AI
  AI: '/ai',
  AI_ASSISTANTS: '/ai/assistants',
  AI_PLAYGROUND: '/ai/playground',

  // Automations
  AUTOMATIONS: '/automations',
  AUTOMATIONS_WORKFLOWS: '/automations/workflows',

  // Omnichannel
  OMNICHANNEL: '/omnichannel',
  OMNICHANNEL_TICKETS: '/omnichannel/tickets',

  // Analytics
  ANALYTICS: '/analytics',

  // Notifications
  NOTIFICATIONS: '/notifications',

  // Settings
  SETTINGS: '/settings',
  SETTINGS_PROFILE: '/settings/profile',
  SETTINGS_COMPANY: '/settings/company',
  SETTINGS_MODULES: '/settings/modules',

  // RBAC
  RBAC_ROLES: '/rbac/roles',
  RBAC_PERMISSIONS: '/rbac/permissions',

  // Webhooks
  WEBHOOKS: '/webhooks',

  // Files
  FILES: '/files',

  // Search
  SEARCH: '/search',

  // Audit
  AUDIT: '/audit',

  // ERP
  ERP_INVOICES: '/erp/invoices',
  ERP_EXPENSES: '/erp/expenses',
  ERP_FINANCIAL: '/erp/financial',

  // Services
  SERVICES: '/services',
  SERVICES_MARKETPLACE: '/services/marketplace',

  // Partnerships
  PARTNERSHIPS: '/partnerships',

  // Jobs
  JOBS: '/jobs',
  JOBS_POSITIONS: '/jobs/positions',
  JOBS_APPLICATIONS: '/jobs/applications',

  // Learning
  LEARNING: '/learning',
  LEARNING_PATHS: '/learning/paths',

  // People Growth
  PEOPLE_GROWTH: '/people-growth',

  // FSM
  FSM: '/fsm',

  // CMMS
  CMMS: '/cmms',

  // Error
  NOT_FOUND: '/404',
  UNAUTHORIZED: '/unauthorized',
} as const;

/**
 * Hierarquia de roles (do maior para o menor privilégio)
 */
export const ROLE_HIERARCHY: UserRole[] = [
  'DEV',
  'ADMIN_GERAL',
  'admin',
  'manager',
  'agent',
  'viewer',
];

/**
 * Permissões base por role
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  DEV: ['*'], // Acesso total
  ADMIN_GERAL: ['*'], // Acesso total
  admin: [
    'crm.*',
    'chat.*',
    'knowledge.*',
    'ai.*',
    'automations.*',
    'omnichannel.*',
    'analytics.read',
    'notifications.*',
    'rbac.read',
    'webhooks.*',
    'files.*',
    'erp.*',
    'services.*',
  ],
  manager: [
    'crm.*',
    'chat.*',
    'knowledge.*',
    'ai.read',
    'automations.read',
    'omnichannel.*',
    'analytics.read',
    'notifications.read',
    'files.*',
  ],
  agent: [
    'crm.read',
    'crm.update',
    'chat.*',
    'knowledge.read',
    'omnichannel.read',
    'omnichannel.update',
    'notifications.read',
    'files.read',
  ],
  viewer: [
    'crm.read',
    'chat.read',
    'knowledge.read',
    'analytics.read',
    'notifications.read',
  ],
};

/**
 * Status de ticket/deal
 */
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DRAFT: 'draft',
} as const;

/**
 * Tipos de notificação
 */
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

/**
 * Limites do sistema
 */
export const LIMITS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES_PER_UPLOAD: 10,
  SESSION_TIMEOUT: 30 * 60 * 1000, // 30 minutos
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
} as const;

/**
 * Modos de AI
 */
export const AI_MODES = {
  FULL: 'FULL', // OpenAI completo
  AUTO: 'AUTO', // Híbrido inteligente
  ECONOMICO: 'ECONOMICO', // Apenas Ollama
} as const;

/**
 * Canais de omnichannel
 */
export const CHANNELS = {
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  TELEGRAM: 'telegram',
  WEBCHAT: 'webchat',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
} as const;

/**
 * Prioridades
 */
export const PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

/**
 * WebSocket namespaces
 */
export const WS_NAMESPACES = {
  CHAT: '/chat',
  NOTIFICATIONS: '/notifications',
  OMNICHANNEL: '/omnichannel',
  ANALYTICS: '/analytics',
} as const;

/**
 * LocalStorage keys
 */
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'accessToken',
  REFRESH_TOKEN: 'refreshToken',
  USER: 'user',
  THEME: 'theme',
  LANGUAGE: 'language',
  MODULE_CONFIG: 'moduleConfig',
} as const;

/**
 * Formatos de data
 */
export const DATE_FORMATS = {
  DATE: 'yyyy-MM-dd',
  TIME: 'HH:mm:ss',
  DATETIME: 'yyyy-MM-dd HH:mm:ss',
  DISPLAY_DATE: 'dd/MM/yyyy',
  DISPLAY_DATETIME: 'dd/MM/yyyy HH:mm',
} as const;

/**
 * Categorias de módulos
 */
export const MODULE_CATEGORIES = {
  CORE: 'core',
  BUSINESS: 'business',
  OPERATIONS: 'operations',
  AI: 'ai',
  INFRASTRUCTURE: 'infrastructure',
  ERP: 'erp',
  HR: 'hr',
  SPECIALIZED: 'specialized',
} as const;

/**
 * Cores padrão por categoria
 */
export const CATEGORY_COLORS: Record<string, string> = {
  core: '#3b82f6', // blue
  business: '#10b981', // green
  operations: '#f59e0b', // amber
  ai: '#8b5cf6', // purple
  infrastructure: '#6b7280', // gray
  erp: '#ef4444', // red
  hr: '#ec4899', // pink
  specialized: '#06b6d4', // cyan
};

/**
 * Ícones padrão por categoria
 */
export const CATEGORY_ICONS: Record<string, string> = {
  core: 'CogIcon',
  business: 'BriefcaseIcon',
  operations: 'ChartBarIcon',
  ai: 'CpuChipIcon',
  infrastructure: 'ServerIcon',
  erp: 'CurrencyDollarIcon',
  hr: 'UsersIcon',
  specialized: 'WrenchIcon',
};
