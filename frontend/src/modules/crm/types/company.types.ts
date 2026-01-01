/**
 * Company Types
 * Tipos para gestão de empresas/contas
 */

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type CompanyStatus = 'lead' | 'prospect' | 'customer' | 'partner' | 'inactive';

export interface Company {
  id: string;
  name: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  status: CompanyStatus;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags?: string[];
  notes?: string;
  assignedTo?: string;
  assignedToName?: string;
  contactsCount?: number;
  dealsCount?: number;
  totalValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCompanyRequest {
  name: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  status?: CompanyStatus;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags?: string[];
  notes?: string;
  assignedTo?: string;
}

export interface UpdateCompanyRequest {
  name?: string;
  website?: string;
  industry?: string;
  size?: CompanySize;
  status?: CompanyStatus;
  email?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  tags?: string[];
  notes?: string;
  assignedTo?: string;
}

export interface CompanyFilters {
  status?: CompanyStatus;
  size?: CompanySize;
  industry?: string;
  assignedTo?: string;
  tags?: string[];
  search?: string;
}
