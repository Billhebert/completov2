/**
 * Contact Types
 * Tipos para gestão de contatos/leads
 */

export type ContactStatus = 'lead' | 'prospect' | 'customer' | 'inactive';
export type ContactSource = 'website' | 'referral' | 'social' | 'email' | 'phone' | 'event' | 'other';

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  position?: string;
  companyId?: string;
  companyName?: string;
  status: ContactStatus;
  source: ContactSource;
  tags?: string[];
  notes?: string;
  assignedTo?: string;
  assignedToName?: string;
  lastContactDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  mobile?: string;
  position?: string;
  companyId?: string;
  status?: ContactStatus;
  source: ContactSource;
  tags?: string[];
  notes?: string;
  assignedTo?: string;
}

export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  position?: string;
  companyId?: string;
  status?: ContactStatus;
  source?: ContactSource;
  tags?: string[];
  notes?: string;
  assignedTo?: string;
}

export interface ContactFilters {
  status?: ContactStatus;
  source?: ContactSource;
  companyId?: string;
  assignedTo?: string;
  tags?: string[];
  search?: string;
}
