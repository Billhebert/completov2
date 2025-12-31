/**
 * RBAC Module Types
 */

export interface Rbac {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateRbacRequest {
  name: string;
  description?: string;
}

export interface UpdateRbacRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
