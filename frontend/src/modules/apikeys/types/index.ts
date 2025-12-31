/**
 * API Keys Module Types
 */

export interface Apikeys {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateApikeysRequest {
  name: string;
  description?: string;
}

export interface UpdateApikeysRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
