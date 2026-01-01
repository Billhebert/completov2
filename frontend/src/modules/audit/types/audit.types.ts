/**
 * Audit Types
 * Tipos para auditoria e logs do sistema
 */

export interface AuditLog {
  id: string;

  action: string; // 'create', 'update', 'delete', 'login', 'logout', etc
  entityType: string; // 'contact', 'deal', 'user', etc
  entityId: string;
  entityName?: string;

  userId: string;
  userName: string;
  userEmail: string;

  changes?: Record<string, { old: unknown; new: unknown }>;
  metadata?: Record<string, unknown>;

  ipAddress?: string;
  userAgent?: string;

  timestamp: string;
}

export interface AuditFilters {
  action?: string;
  entityType?: string;
  entityId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface AuditStats {
  totalLogs: number;
  actionsByType: Record<string, number>;
  topUsers: Array<{ userId: string; userName: string; count: number }>;
  recentActivity: AuditLog[];
}
