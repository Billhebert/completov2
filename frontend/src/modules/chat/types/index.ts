/**
 * Chat Module Types
 */

export interface Chat {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatRequest {
  name: string;
  description?: string;
}

export interface UpdateChatRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
