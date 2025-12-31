/**
 * CRM Module Types
 */

export interface Crm {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCrmRequest {
  name: string;
  description?: string;
}

export interface UpdateCrmRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
