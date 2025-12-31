/**
 * Narrativas IA Module Types
 */

export interface Narrative {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateNarrativeRequest {
  name: string;
  description?: string;
}

export interface UpdateNarrativeRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
