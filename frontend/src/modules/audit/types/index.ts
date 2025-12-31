/**
 * Auditoria Module Types
 */

export interface Audit {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAuditRequest {
  name: string;
  description?: string;
}

export interface UpdateAuditRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
