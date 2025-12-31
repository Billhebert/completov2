/**
 * Analytics Module Types
 */

export interface Analytics {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateAnalyticsRequest {
  name: string;
  description?: string;
}

export interface UpdateAnalyticsRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
