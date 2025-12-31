/**
 * ERP Module Types
 */

export interface Erp {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateErpRequest {
  name: string;
  description?: string;
}

export interface UpdateErpRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
