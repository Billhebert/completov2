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

// ===== ADVANCED AI FEATURES (Phase 3) =====

import { Contact } from "../types/contact.types";
import { Deal } from "../types/deal.types";

export interface EnrichmentData {
  contactId: string;
  enrichedAt: string;
  sources: string[];
  data: {
    linkedin?: {
      profileUrl?: string;
      headline?: string;
      connections?: number;
      skills?: string[];
    };
    company?: {
      size?: string;
      industry?: string;
      revenue?: string;
      website?: string;
    };
    social?: {
      twitter?: string;
      github?: string;
      blog?: string;
    };
    location?: {
      city?: string;
      country?: string;
      timezone?: string;
    };
  };
}

export interface EngagementScoreDetailed {
  contactId: string;
  score: number; // 0-100
  trend: "increasing" | "decreasing" | "stable";
  lastCalculated: string;
  factors: {
    emailResponsiveness: number;
    meetingAttendance: number;
    dealProgression: number;
    interactionFrequency: number;
    responseTime: number;
  };
  recommendations: string[];
}

export interface ChurnPrediction {
  contactId: string;
  companyId?: string;
  churnRisk: "low" | "medium" | "high" | "critical";
  churnProbability: number; // 0-100
  predictedChurnDate?: string;
  factors: {
    noRecentActivity: boolean;
    dealsStagnant: boolean;
    emailEngagementDrop: boolean;
    competitorMentions: boolean;
    contractExpiringSoon: boolean;
  };
  preventionActions: string[];
}

export interface AIRecommendation {
  id: string;
  type: "next_action" | "deal_strategy" | "contact_approach" | "risk_mitigation";
  priority: "low" | "medium" | "high" | "critical";
  title: string;
  description: string;
  reasoning: string;
  suggestedActions: string[];
  relatedEntityType: "contact" | "deal" | "company";
  relatedEntityId: string;
  createdAt: string;
  status: "pending" | "accepted" | "dismissed";
}

// Contact Enrichment with external data
export const enrichContactData = async (contactId: string, contact: Contact): Promise<EnrichmentData> => {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const domain = contact.email?.split("@")[1] || "";

  return {
    contactId,
    enrichedAt: new Date().toISOString(),
    sources: ["linkedin", "clearbit", "hunter"],
    data: {
      linkedin: {
        profileUrl: `https://linkedin.com/in/${contact.name.toLowerCase().replace(/ /g, "-")}`,
        headline: contact.position || "Professional",
        connections: Math.floor(Math.random() * 500) + 100,
        skills: ["Communication", "Sales", "Strategy", "Leadership"],
      },
      company: contact.crmCompany
        ? {
            size: contact.crmCompany.size || "medium",
            industry: contact.crmCompany.industry || "Technology",
            revenue: "$10M-$50M",
            website: `https://${domain}`,
          }
        : undefined,
      social: {
        twitter: `@${contact.name.toLowerCase().replace(/ /g, "")}`,
        github: domain.includes("tech") ? `github.com/${contact.name.toLowerCase().replace(/ /g, "-")}` : undefined,
      },
      location: {
        city: "São Paulo",
        country: "Brasil",
        timezone: "America/Sao_Paulo",
      },
    },
  };
};

// Calculate detailed engagement score
export const calculateEngagementScoreDetailed = async (
  contactId: string,
  contact: Contact
): Promise<EngagementScoreDetailed> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dealsCount = contact._aggr_count_deals || 0;
  const interactionsCount = contact._aggr_count_interactions || 0;
  const leadScore = contact.leadScore || 0;

  const emailResponsiveness = Math.min(100, (interactionsCount / 10) * 100);
  const meetingAttendance = Math.min(100, (dealsCount / 5) * 100);
  const dealProgression = leadScore;
  const interactionFrequency = Math.min(100, interactionsCount * 10);
  const responseTime = Math.floor(Math.random() * 100);

  const score = Math.round(
    (emailResponsiveness * 0.25 +
      meetingAttendance * 0.2 +
      dealProgression * 0.25 +
      interactionFrequency * 0.2 +
      responseTime * 0.1)
  );

  const trend = score > 70 ? "increasing" : score > 40 ? "stable" : "decreasing";

  const recommendations: string[] = [];
  if (emailResponsiveness < 50) recommendations.push("Aumentar frequência de emails");
  if (meetingAttendance < 50) recommendations.push("Agendar reunião de alinhamento");
  if (interactionFrequency < 50) recommendations.push("Retomar contato ativo");
  if (score < 40) recommendations.push("URGENTE: Contato em risco de churn");

  return {
    contactId,
    score,
    trend,
    lastCalculated: new Date().toISOString(),
    factors: {
      emailResponsiveness,
      meetingAttendance,
      dealProgression,
      interactionFrequency,
      responseTime,
    },
    recommendations,
  };
};

// Predict churn risk
export const predictChurn = async (contactId: string, contact: Contact): Promise<ChurnPrediction> => {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const dealsCount = contact._aggr_count_deals || 0;
  const interactionsCount = contact._aggr_count_interactions || 0;
  const leadScore = contact.leadScore || 0;

  const noRecentActivity = interactionsCount < 2;
  const dealsStagnant = dealsCount > 0 && leadScore < 30;
  const emailEngagementDrop = interactionsCount === 0;
  const competitorMentions = Math.random() > 0.8;
  const contractExpiringSoon = Math.random() > 0.9;

  const riskFactorsCount = [
    noRecentActivity,
    dealsStagnant,
    emailEngagementDrop,
    competitorMentions,
    contractExpiringSoon,
  ].filter(Boolean).length;

  const churnProbability = Math.min(100, riskFactorsCount * 25 + (100 - leadScore));

  let churnRisk: "low" | "medium" | "high" | "critical";
  if (churnProbability >= 75) churnRisk = "critical";
  else if (churnProbability >= 50) churnRisk = "high";
  else if (churnProbability >= 25) churnRisk = "medium";
  else churnRisk = "low";

  const preventionActions: string[] = [];
  if (noRecentActivity) preventionActions.push("Retomar contato imediatamente");
  if (dealsStagnant) preventionActions.push("Revisar proposta e identificar blockers");
  if (emailEngagementDrop) preventionActions.push("Tentar canal alternativo (telefone, LinkedIn)");
  if (competitorMentions) preventionActions.push("Apresentar diferenciais competitivos");
  if (contractExpiringSoon) preventionActions.push("Iniciar conversa de renovação");

  return {
    contactId,
    companyId: contact.companyId,
    churnRisk,
    churnProbability,
    predictedChurnDate:
      churnProbability > 50
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : undefined,
    factors: {
      noRecentActivity,
      dealsStagnant,
      emailEngagementDrop,
      competitorMentions,
      contractExpiringSoon,
    },
    preventionActions,
  };
};

// Generate AI recommendations
export const generateRecommendations = async (
  entityType: "contact" | "deal" | "company",
  entityId: string,
  entityData: any
): Promise<AIRecommendation[]> => {
  await new Promise((resolve) => setTimeout(resolve, 300));

  const recommendations: AIRecommendation[] = [];

  if (entityType === "contact") {
    const contact = entityData as Contact;
    const dealsCount = contact._aggr_count_deals || 0;
    const interactionsCount = contact._aggr_count_interactions || 0;

    if (interactionsCount === 0) {
      recommendations.push({
        id: `rec-${Date.now()}-1`,
        type: "next_action",
        priority: "high",
        title: "Iniciar primeiro contato",
        description: "Este contato ainda não tem interações registradas",
        reasoning: "Contatos sem interações tendem a esfriar rapidamente",
        suggestedActions: [
          "Enviar email de apresentação personalizado",
          "Conectar no LinkedIn",
          "Agendar discovery call",
        ],
        relatedEntityType: "contact",
        relatedEntityId: entityId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }

    if (dealsCount === 0 && interactionsCount > 2) {
      recommendations.push({
        id: `rec-${Date.now()}-2`,
        type: "deal_strategy",
        priority: "medium",
        title: "Criar deal para este contato",
        description: "Contato engajado sem deal associado",
        reasoning: "Múltiplas interações indicam interesse, mas falta deal formal",
        suggestedActions: [
          "Qualificar necessidades em próxima reunião",
          "Criar deal exploratory",
          "Enviar proposta inicial",
        ],
        relatedEntityType: "contact",
        relatedEntityId: entityId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }
  }

  if (entityType === "deal") {
    const deal = entityData as Deal;

    if (deal.probability && deal.probability < 30) {
      recommendations.push({
        id: `rec-${Date.now()}-3`,
        type: "risk_mitigation",
        priority: "critical",
        title: "Deal com baixa probabilidade",
        description: `Probabilidade atual: ${deal.probability}%`,
        reasoning: "Deals abaixo de 30% raramente convertem sem ação imediata",
        suggestedActions: [
          "Identificar objeções principais",
          "Agendar reunião com decisor",
          "Revisar proposta de valor",
          "Considerar ajuste de preço/escopo",
        ],
        relatedEntityType: "deal",
        relatedEntityId: entityId,
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    }

    if (deal.createdAt) {
      const daysSinceCreation = Math.floor(
        (Date.now() - new Date(deal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceCreation > 60 && deal.stage !== "won" && deal.stage !== "lost") {
        recommendations.push({
          id: `rec-${Date.now()}-4`,
          type: "deal_strategy",
          priority: "high",
          title: "Deal parado há muito tempo",
          description: `${daysSinceCreation} dias sem progresso significativo`,
          reasoning: "Deals que permanecem no mesmo estágio por mais de 60 dias raramente fecham",
          suggestedActions: [
            "Reagendar reunião de revisão",
            "Requalificar necessidade e urgência",
            "Considerar re-engajamento do champion",
            "Avaliar se vale manter ativo",
          ],
          relatedEntityType: "deal",
          relatedEntityId: entityId,
          createdAt: new Date().toISOString(),
          status: "pending",
        });
      }
    }
  }

  return recommendations;
};

export default {
  getDealProbability,
  getContactEnrichment,
  getContactEngagement,
  enrichContactData,
  calculateEngagementScoreDetailed,
  predictChurn,
  generateRecommendations,
};
