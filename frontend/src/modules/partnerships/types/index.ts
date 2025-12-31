/**
 * Parcerias Module Types
 */

export interface Partnerships {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartnershipsRequest {
  name: string;
  description?: string;
}

export interface UpdatePartnershipsRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
