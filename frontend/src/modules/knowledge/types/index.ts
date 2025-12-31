/**
 * Base de Conhecimento Module Types
 */

export interface Knowledge {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateKnowledgeRequest {
  name: string;
  description?: string;
}

export interface UpdateKnowledgeRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
