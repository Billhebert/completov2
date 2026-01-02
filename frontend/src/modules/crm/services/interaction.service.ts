/**
 * Interaction Service
 *
 * Serviço para gerenciar interações (ligações, emails, reuniões e anotações)
 * com contatos e deals no CRM.
 */

import api, { extractData } from '../../../core/utils/api';

export type InteractionType = 'call' | 'email' | 'meeting' | 'note';
export type InteractionDirection = 'inbound' | 'outbound';

export interface Interaction {
  id: string;
  type: InteractionType;
  subject?: string;
  content: string;
  direction?: InteractionDirection;
  timestamp: string;
  scheduledFor?: string;
  contactId?: string;
  dealId?: string;
  userId: string;
  companyId: string;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  contact?: {
    id: string;
    name: string;
  };
  deal?: {
    id: string;
    title: string;
  };
}

export interface CreateInteractionRequest {
  type: InteractionType;
  contactId?: string;
  dealId?: string;
  subject?: string;
  content: string;
  direction?: InteractionDirection;
  scheduledFor?: string;
}

export interface InteractionFilters {
  contactId?: string;
  dealId?: string;
  type?: InteractionType;
  limit?: number;
}

/**
 * Cria uma nova interação
 */
export const createInteraction = async (
  data: CreateInteractionRequest
): Promise<Interaction> => {
  const response = await api.post('/crm/interactions', data);
  return extractData(response);
};

/**
 * Lista interações com filtros opcionais
 */
export const getInteractions = async (
  params?: InteractionFilters
): Promise<Interaction[]> => {
  const response = await api.get('/crm/interactions', { params });
  return extractData(response);
};

export default {
  createInteraction,
  getInteractions,
};
