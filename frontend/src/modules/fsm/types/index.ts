/**
 * Field Service Module Types
 */

export interface Fsm {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateFsmRequest {
  name: string;
  description?: string;
}

export interface UpdateFsmRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
