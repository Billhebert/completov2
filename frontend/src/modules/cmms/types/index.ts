/**
 * CMMS Module Types
 */

export interface Cmms {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateCmmsRequest {
  name: string;
  description?: string;
}

export interface UpdateCmmsRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
