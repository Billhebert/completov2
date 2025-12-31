/**
 * SSO Module Types
 */

export interface Sso {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSsoRequest {
  name: string;
  description?: string;
}

export interface UpdateSsoRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
