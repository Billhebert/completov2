/**
 * Configurações Module Types
 */

export interface Settings {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateSettingsRequest {
  name: string;
  description?: string;
}

export interface UpdateSettingsRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
