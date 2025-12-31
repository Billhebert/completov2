/**
 * Deduplicação IA Module Types
 */

export interface Deduplication {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeduplicationRequest {
  name: string;
  description?: string;
}

export interface UpdateDeduplicationRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
