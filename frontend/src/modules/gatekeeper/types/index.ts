/**
 * Gatekeeper Module Types
 */

export interface Gatekeeper {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateGatekeeperRequest {
  name: string;
  description?: string;
}

export interface UpdateGatekeeperRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
