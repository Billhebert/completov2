/**
 * Deal Types
 * Tipos para gestão de negociações/oportunidades
 */

export type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
export type DealPriority = 'low' | 'medium' | 'high';

export interface Deal {
  id: string;
  title: string;
  description?: string;
  value: number;
  stage: DealStage;
  priority: DealPriority;
  probability: number; // 0-100
  contactId?: string;
  contactName?: string;
  companyId?: string;
  companyName?: string;
  assignedTo?: string;
  assignedToName?: string;
  expectedCloseDate?: string;
  closedDate?: string;
  tags?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDealRequest {
  title: string;
  description?: string;
  value: number;
  stage?: DealStage;
  priority?: DealPriority;
  probability?: number;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  expectedCloseDate?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateDealRequest {
  title?: string;
  description?: string;
  value?: number;
  stage?: DealStage;
  priority?: DealPriority;
  probability?: number;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  expectedCloseDate?: string;
  closedDate?: string;
  tags?: string[];
  notes?: string;
}

export interface DealFilters {
  stage?: DealStage;
  priority?: DealPriority;
  contactId?: string;
  companyId?: string;
  assignedTo?: string;
  minValue?: number;
  maxValue?: number;
  tags?: string[];
  search?: string;
}
