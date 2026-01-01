/**
 * Common Types
 * Tipos compartilhados por toda a aplicação
 */

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: ValidationError[];
  meta?: ResponseMeta;
}

/**
 * Metadata da resposta
 */
export interface ResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  totalPages?: number;
  timestamp?: string;
}

/**
 * Erro de validação
 */
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

/**
 * Parâmetros de paginação
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Filtros genéricos
 */
export interface FilterParams {
  search?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  [key: string]: unknown;
}

/**
 * Usuário autenticado
 */
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  permissions: string[];
  companyId: string;
  phone?: string;
  company?: string;
  position?: string;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  twoFactorEnabled?: boolean;
}

/**
 * Roles de usuário
 */
export type UserRole =
  | 'DEV'
  | 'ADMIN_GERAL'
  | 'admin'
  | 'manager'
  | 'agent'
  | 'viewer';

/**
 * Permissão
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: PermissionAction;
}

/**
 * Ações de permissão
 */
export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage';

/**
 * Estado de carregamento
 */
export interface LoadingState {
  isLoading: boolean;
  error?: string;
  message?: string;
}

/**
 * Opção de select
 */
export interface SelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
  icon?: string;
  description?: string;
}

/**
 * Configuração de tabela
 */
export interface TableColumn<T = unknown> {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: unknown, record: T) => React.ReactNode;
}

/**
 * Ação de tabela
 */
export interface TableAction<T = unknown> {
  label: string;
  icon?: string;
  onClick: (record: T) => void;
  show?: (record: T) => boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}

/**
 * Notificação
 */
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
  read: boolean;
  actionLabel?: string;
  actionUrl?: string;
}

/**
 * Configuração do sistema
 */
export interface SystemConfig {
  appName: string;
  appVersion: string;
  apiUrl: string;
  wsUrl: string;
  environment: 'development' | 'staging' | 'production';
  features: {
    [key: string]: boolean;
  };
  limits: {
    maxFileSize: number;
    maxFilesPerUpload: number;
    sessionTimeout: number;
  };
}

/**
 * Estado da aplicação
 */
export interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  config: SystemConfig;
  notifications: Notification[];
  isOnline: boolean;
  isLoading: boolean;
}

/**
 * Evento do WebSocket
 */
export interface WebSocketEvent<T = unknown> {
  event: string;
  data: T;
  timestamp: string;
  userId?: string;
  companyId?: string;
}

/**
 * Status genérico
 */
export type Status =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'completed'
  | 'cancelled'
  | 'draft';

/**
 * Tipo de arquivo
 */
export interface FileData {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
  thumbnailUrl?: string;
  uploadedAt: string;
  uploadedBy: string;
}

/**
 * Auditoria
 */
export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  userName: string;
  changes?: Record<string, unknown>;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
}
