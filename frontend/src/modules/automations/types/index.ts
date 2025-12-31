/**
 * Automações Module Types
 */

export interface Automations {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAutomationsRequest {
  name: string;
  description?: string;
}

export interface UpdateAutomationsRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
