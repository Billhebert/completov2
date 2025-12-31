/**
 * Arquivos Module Types
 */

export interface Files {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFilesRequest {
  name: string;
  description?: string;
}

export interface UpdateFilesRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
