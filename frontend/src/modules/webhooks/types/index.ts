/**
 * Webhooks Module Types
 */

export interface Webhooks {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateWebhooksRequest {
  name: string;
  description?: string;
}

export interface UpdateWebhooksRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
