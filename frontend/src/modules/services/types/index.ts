/**
 * Serviços Module Types
 */

export interface Services {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateServicesRequest {
  name: string;
  description?: string;
}

export interface UpdateServicesRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
