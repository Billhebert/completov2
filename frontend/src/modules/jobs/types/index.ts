/**
 * Vagas Module Types
 */

export interface Jobs {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateJobsRequest {
  name: string;
  description?: string;
}

export interface UpdateJobsRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
