/**
 * Aprendizado Module Types
 */

export interface Learning {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateLearningRequest {
  name: string;
  description?: string;
}

export interface UpdateLearningRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
