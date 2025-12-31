/**
 * Sincronização Module Types
 */

export interface Sync {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSyncRequest {
  name: string;
  description?: string;
}

export interface UpdateSyncRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
