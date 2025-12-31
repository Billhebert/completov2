/**
 * Templates de Email Module Types
 */

export interface EmailTemplates {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface CreateEmailTemplatesRequest {
  name: string;
  description?: string;
}

export interface UpdateEmailTemplatesRequest {
  name?: string;
  description?: string;
  status?: 'active' | 'inactive';
}
