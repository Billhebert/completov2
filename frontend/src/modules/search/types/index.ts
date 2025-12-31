/**
 * Busca Global Module Types
 */

export interface Search {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSearchRequest {
  name: string;
  description?: string;
}

export interface UpdateSearchRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
