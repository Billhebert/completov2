/**
 * Omnichannel Module Types
 */

export interface Omnichannel {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOmnichannelRequest {
  name: string;
  description?: string;
}

export interface UpdateOmnichannelRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
