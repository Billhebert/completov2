/**
 * IA Module Types
 */

export interface Ai {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAiRequest {
  name: string;
  description?: string;
}

export interface UpdateAiRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
