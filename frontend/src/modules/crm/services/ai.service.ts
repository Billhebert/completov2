/**
 * AI Service
 *
 * Serviço para funcionalidades de inteligência artificial do CRM,
 * incluindo probabilidade de fechamento de negócios, enriquecimento
 * de dados de contatos e score de engajamento.
 */

import api, { extractData } from '../../../core/utils/api';

export type RiskLevel = 'high' | 'medium' | 'low';
export type EngagementLevel = 'high' | 'medium' | 'low';

export interface DealProbability {
  probability: number; // 0-100
  confidence: 'high' | 'medium' | 'low';
  riskLevel: RiskLevel;
  suggestedActions: string[];
  analysis: {
    dealAge: number; // dias
    interactionCount: number;
    daysSinceLastContact: number | null;
  };
}

export interface ContactEnrichment {
  complete: boolean;
  completionPercentage?: number;
  missingFields?: string[];
  suggestions: string[];
  message?: string;
}

export interface ContactEngagement {
  engagementScore: number; // 0-100
  level: EngagementLevel;
  metrics: {
    totalInteractions: number;
    recentInteractions: number; // últimos 30 dias
    daysSinceLastContact: number | null;
    openDeals: number;
    totalDeals: number;
  };
  nextAction: string;
}

/**
 * Obtém a probabilidade de fechamento de um deal usando IA
 */
export const getDealProbability = async (
  dealId: string
): Promise<DealProbability> => {
  const response = await api.get(`/crm/deals/${dealId}/probability`);
  return extractData(response);
};

/**
 * Obtém sugestões de enriquecimento de dados para um contato
 */
export const getContactEnrichment = async (
  contactId: string
): Promise<ContactEnrichment> => {
  const response = await api.get(`/crm/contacts/${contactId}/enrich`);
  return extractData(response);
};

/**
 * Calcula o score de engajamento de um contato
 */
export const getContactEngagement = async (
  contactId: string
): Promise<ContactEngagement> => {
  const response = await api.get(`/crm/contacts/${contactId}/engagement`);
  return extractData(response);
};

export default {
  getDealProbability,
  getContactEnrichment,
  getContactEngagement,
};
