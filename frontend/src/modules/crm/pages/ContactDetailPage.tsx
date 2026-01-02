/**
 * Contact Detail Page
 * Página de detalhes do contato com timeline de interações, atividades e deals
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout, Card, Button, Breadcrumbs } from "../../shared";
import { Contact } from "../types";
import * as contactService from "../services/contact.service";
import * as interactionService from "../services/interaction.service";
import * as activityService from "../services/activity.service";
import * as dealService from "../services/deal.service";
import * as aiService from "../services/ai.service";
import { handleApiError } from "../../../core/utils/api";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Interaction } from "../services/interaction.service";
import type { Activity } from "../services/activity.service";
import type { Deal } from "../types/deal.types";
import type {
  EnrichmentData,
  EngagementScoreDetailed,
  ChurnPrediction,
  AIRecommendation,
} from "../services/ai.service";
import {
  SparklesIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  LightBulbIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  MinusIcon,
} from "@heroicons/react/24/outline";

type TimelineItem = {
  id: string;
  type: "interaction" | "activity" | "deal";
  date: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  data: Interaction | Activity | Deal;
};

function getInitials(name?: string) {
  const safe = (name ?? "").trim();
  if (!safe) return "??";
  const parts = safe.split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "?";
  const last =
    (parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1]) ?? "?";
  return `${first}${last}`.toUpperCase();
}

function statusBadgeClass(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800",
    prospect: "bg-yellow-100 text-yellow-800",
    qualified: "bg-indigo-100 text-indigo-800",
    customer: "bg-green-100 text-green-800",
    nurturing: "bg-purple-100 text-purple-800",
    lost: "bg-red-100 text-red-800",
    inactive: "bg-gray-100 text-gray-800",
  };
  return map[s] ?? "bg-gray-100 text-gray-800";
}

function statusLabel(status?: string | null) {
  const s = (status ?? "").toLowerCase();
  const map: Record<string, string> = {
    lead: "Lead",
    prospect: "Prospect",
    qualified: "Qualificado",
    customer: "Cliente",
    nurturing: "Nutrição",
    lost: "Perdido",
    inactive: "Inativo",
  };
  return map[s] ?? (status || "N/A");
}

export default function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contact, setContact] = useState<Contact | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // AI Insights State
  const [enrichmentData, setEnrichmentData] = useState<EnrichmentData | null>(null);
  const [engagementScore, setEngagementScore] = useState<EngagementScoreDetailed | null>(null);
  const [churnPrediction, setChurnPrediction] = useState<ChurnPrediction | null>(null);
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [loadingAI, setLoadingAI] = useState(false);

  useEffect(() => {
    if (!id) return;
    loadContactDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadContactDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    setError("");

    try {
      // Carrega o contato e dados relacionados em paralelo
      const [contactData, interactionsData, activitiesData, dealsData] =
        await Promise.all([
          contactService.getContactById(id),
          interactionService
            .getInteractions({ contactId: id, limit: 50 })
            .catch(() => []),
          activityService
            .getActivities({ contactId: id, page: 1, limit: 50 })
            .then((res) => res.data || [])
            .catch(() => []),
          dealService
            .getDeals({ page: 1, limit: 50 })
            .then((res) =>
              res.data.filter((d: any) => d.contactId === id)
            )
            .catch(() => []),
        ]);

      setContact(contactData);
      setInteractions(interactionsData);
      setActivities(activitiesData);
      setDeals(dealsData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  // Load AI Insights
  const loadAIInsights = async () => {
    if (!contact || !id) return;

    setLoadingAI(true);

    try {
      const [enrichment, engagement, churn, recommendations] = await Promise.all([
        aiService.enrichContactData(id, contact),
        aiService.calculateEngagementScoreDetailed(id, contact),
        aiService.predictChurn(id, contact),
        aiService.generateRecommendations("contact", id, contact),
      ]);

      setEnrichmentData(enrichment);
      setEngagementScore(engagement);
      setChurnPrediction(churn);
      setAiRecommendations(recommendations);
    } catch (err) {
      console.error("Failed to load AI insights:", err);
    } finally {
      setLoadingAI(false);
    }
  };

  // Load AI insights when contact is loaded
  useEffect(() => {
    if (contact) {
      loadAIInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contact]);

  // Cria timeline unificada
  const timeline: TimelineItem[] = [
    ...interactions.map((i) => ({
      id: i.id,
      type: "interaction" as const,
      date: i.timestamp,
      title:
        i.type === "call"
          ? "Ligação"
          : i.type === "email"
            ? "Email"
            : i.type === "meeting"
              ? "Reunião"
              : "Nota",
      description: i.subject || i.content.substring(0, 100),
      icon: "💬",
      color: "blue",
      data: i,
    })),
    ...activities.map((a) => ({
      id: a.id,
      type: "activity" as const,
      date: a.dueDate || a.createdAt,
      title:
        a.type === "task"
          ? "Tarefa"
          : a.type === "call"
            ? "Ligação agendada"
            : a.type === "meeting"
              ? "Reunião agendada"
              : "Email agendado",
      description: a.subject,
      icon: "📋",
      color: "purple",
      data: a,
    })),
    ...deals.map((d) => ({
      id: d.id,
      type: "deal" as const,
      date: d.createdAt || new Date().toISOString(),
      title: "Negociação criada",
      description: `${d.title} - ${new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: d.currency || "BRL",
      }).format(d.value)}`,
      icon: "💰",
      color: "green",
      data: d,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Carregando contato...</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error || !contact) {
    return (
      <AppLayout>
        <div className="page-container">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Erro ao carregar contato
            </h3>
            <p className="text-gray-600 mb-4">{error || "Contato não encontrado"}</p>
            <Button onClick={() => navigate("/crm/contacts")}>
              Voltar para contatos
            </Button>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="page-container">
        <Breadcrumbs
          items={[
            { label: "CRM", path: "/crm" },
            { label: "Contatos", path: "/crm/contacts" },
            { label: contact.name },
          ]}
          className="mb-4"
        />

        {/* Header do contato */}
        <Card className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-medium mr-4">
                {getInitials(contact.name)}
              </div>

              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {contact.name}
                </h1>
                {contact.position && (
                  <p className="text-gray-600 mt-1">{contact.position}</p>
                )}

                <div className="flex items-center gap-4 mt-3">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadgeClass(
                      contact.leadStatus
                    )}`}
                  >
                    {statusLabel(contact.leadStatus)}
                  </span>

                  {contact.email && (
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      {contact.email}
                    </a>
                  )}

                  {contact.phone && (
                    <span className="text-gray-600 text-sm">{contact.phone}</span>
                  )}
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              onClick={() => navigate(`/crm/contacts`)}
            >
              Voltar
            </Button>
          </div>

          {/* Informações adicionais */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">
                  Empresa
                </h3>
                <p className="text-gray-900">
                  {contact.crmCompany
                    ? contact.crmCompany.name
                    : contact.companyName || "-"}
                </p>
              </div>

              {contact.website && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Website
                  </h3>
                  <a
                    href={contact.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    {contact.website}
                  </a>
                </div>
              )}

              {contact.lastContactedAt && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">
                    Último contato
                  </h3>
                  <p className="text-gray-900">
                    {formatDistanceToNow(new Date(contact.lastContactedAt), {
                      addSuffix: true,
                      locale: ptBR,
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Estatísticas */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Estatísticas
              </h2>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Negociações</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {deals.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Interações</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {interactions.length}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Atividades</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {activities.length}
                  </span>
                </div>

                {deals.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">
                      Valor total em negociações
                    </span>
                    <p className="text-xl font-bold text-green-600 mt-1">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: deals[0]?.currency || "BRL",
                      }).format(
                        deals.reduce((sum, d) => sum + d.value, 0)
                      )}
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Ações rápidas */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Ações rápidas
              </h2>
              <div className="space-y-2">
                <Button variant="secondary" className="w-full justify-start">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  Registrar ligação
                </Button>

                <Button variant="secondary" className="w-full justify-start">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  Enviar email
                </Button>

                <Button variant="secondary" className="w-full justify-start">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Nova tarefa
                </Button>

                <Button variant="primary" className="w-full justify-start">
                  <svg
                    className="w-5 h-5 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Nova negociação
                </Button>
              </div>
            </Card>
          </div>

          {/* Timeline */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Timeline de atividades
              </h2>

              {timeline.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Nenhuma atividade registrada ainda.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Use as ações rápidas para começar a interagir com este
                    contato.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {timeline.map((item) => (
                    <div key={`${item.type}-${item.id}`} className="flex">
                      <div className="flex-shrink-0 mr-4">
                        <div
                          className={`w-10 h-10 rounded-full bg-${item.color}-100 flex items-center justify-center text-lg`}
                        >
                          {item.icon}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {item.title}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {item.description}
                            </p>
                          </div>

                          <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                            {formatDistanceToNow(new Date(item.date), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>

                        {item.type === "activity" && (
                          <div className="mt-2">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                (item.data as Activity).status === "done"
                                  ? "bg-green-100 text-green-800"
                                  : (item.data as Activity).status === "in_progress"
                                    ? "bg-blue-100 text-blue-800"
                                    : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {(item.data as Activity).status === "done"
                                ? "Concluída"
                                : (item.data as Activity).status === "in_progress"
                                  ? "Em andamento"
                                  : "Pendente"}
                            </span>
                          </div>
                        )}

                        {item.type === "deal" && (
                          <div className="mt-2">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                              {(item.data as Deal).stage}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* AI Insights Section */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <SparklesIcon className="h-7 w-7 text-purple-600" />
              AI Insights
            </h2>
            {loadingAI && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600" />
                Analisando...
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Engagement Score */}
            {engagementScore && (
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <ChartBarIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Score de Engajamento
                      </h3>
                      <p className="text-sm text-gray-600">
                        Nível de interação e atividade
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-blue-600">
                      {engagementScore.score}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                      {engagementScore.trend === "increasing" && (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-600" />
                      )}
                      {engagementScore.trend === "decreasing" && (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-600" />
                      )}
                      {engagementScore.trend === "stable" && (
                        <MinusIcon className="h-4 w-4 text-gray-600" />
                      )}
                      {engagementScore.trend === "increasing" ? "Crescendo" :
                       engagementScore.trend === "decreasing" ? "Decrescendo" : "Estável"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {Object.entries(engagementScore.factors).map(([key, value]) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 capitalize">
                          {key === "emailResponsiveness" && "Email"}
                          {key === "meetingAttendance" && "Reuniões"}
                          {key === "dealProgression" && "Progresso Deals"}
                          {key === "interactionFrequency" && "Frequência"}
                          {key === "responseTime" && "Tempo Resposta"}
                        </span>
                        <span className="font-semibold text-gray-900">
                          {Math.round(value)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            value >= 70
                              ? "bg-green-500"
                              : value >= 40
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {engagementScore.recommendations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Recomendações:
                    </p>
                    <ul className="space-y-1">
                      {engagementScore.recommendations.map((rec, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-blue-600 mt-0.5">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {/* Churn Prediction */}
            {churnPrediction && (
              <Card>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-3 rounded-lg ${
                        churnPrediction.churnRisk === "critical"
                          ? "bg-red-100"
                          : churnPrediction.churnRisk === "high"
                            ? "bg-orange-100"
                            : churnPrediction.churnRisk === "medium"
                              ? "bg-yellow-100"
                              : "bg-green-100"
                      }`}
                    >
                      <ExclamationTriangleIcon
                        className={`h-6 w-6 ${
                          churnPrediction.churnRisk === "critical"
                            ? "text-red-600"
                            : churnPrediction.churnRisk === "high"
                              ? "text-orange-600"
                              : churnPrediction.churnRisk === "medium"
                                ? "text-yellow-600"
                                : "text-green-600"
                        }`}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Risco de Churn
                      </h3>
                      <p className="text-sm text-gray-600">
                        Probabilidade de perda do contato
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`text-3xl font-bold ${
                        churnPrediction.churnRisk === "critical"
                          ? "text-red-600"
                          : churnPrediction.churnRisk === "high"
                            ? "text-orange-600"
                            : churnPrediction.churnRisk === "medium"
                              ? "text-yellow-600"
                              : "text-green-600"
                      }`}
                    >
                      {Math.round(churnPrediction.churnProbability)}%
                    </div>
                    <div className="text-sm font-semibold text-gray-600 mt-1 uppercase">
                      {churnPrediction.churnRisk === "critical" && "Crítico"}
                      {churnPrediction.churnRisk === "high" && "Alto"}
                      {churnPrediction.churnRisk === "medium" && "Médio"}
                      {churnPrediction.churnRisk === "low" && "Baixo"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <p className="text-sm font-semibold text-gray-900">Fatores de Risco:</p>
                  {Object.entries(churnPrediction.factors).map(([key, active]) =>
                    active ? (
                      <div
                        key={key}
                        className="flex items-center gap-2 text-sm text-gray-700"
                      >
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        {key === "noRecentActivity" && "Sem atividade recente"}
                        {key === "dealsStagnant" && "Deals estagnados"}
                        {key === "emailEngagementDrop" && "Queda no engajamento"}
                        {key === "competitorMentions" && "Menções a concorrentes"}
                        {key === "contractExpiringSoon" && "Contrato expirando"}
                      </div>
                    ) : null
                  )}
                </div>

                {churnPrediction.preventionActions.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-sm font-semibold text-gray-900 mb-2">
                      Ações de Prevenção:
                    </p>
                    <ul className="space-y-1">
                      {churnPrediction.preventionActions.map((action, idx) => (
                        <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                          <span className="text-red-600 mt-0.5">•</span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            )}

            {/* AI Recommendations */}
            {aiRecommendations.length > 0 && (
              <Card className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <LightBulbIcon className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Recomendações de IA
                    </h3>
                    <p className="text-sm text-gray-600">
                      Próximas ações sugeridas pelo sistema
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  {aiRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className={`border-l-4 pl-4 py-3 ${
                        rec.priority === "critical"
                          ? "border-red-500 bg-red-50"
                          : rec.priority === "high"
                            ? "border-orange-500 bg-orange-50"
                            : rec.priority === "medium"
                              ? "border-yellow-500 bg-yellow-50"
                              : "border-blue-500 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900">{rec.title}</h4>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                                rec.priority === "critical"
                                  ? "bg-red-200 text-red-800"
                                  : rec.priority === "high"
                                    ? "bg-orange-200 text-orange-800"
                                    : rec.priority === "medium"
                                      ? "bg-yellow-200 text-yellow-800"
                                      : "bg-blue-200 text-blue-800"
                              }`}
                            >
                              {rec.priority === "critical" && "Crítico"}
                              {rec.priority === "high" && "Alto"}
                              {rec.priority === "medium" && "Médio"}
                              {rec.priority === "low" && "Baixo"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mb-2">{rec.description}</p>
                          <p className="text-xs text-gray-600 italic mb-3">
                            {rec.reasoning}
                          </p>

                          {rec.suggestedActions.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-gray-900 mb-1">
                                Ações sugeridas:
                              </p>
                              <ul className="space-y-1">
                                {rec.suggestedActions.map((action, idx) => (
                                  <li
                                    key={idx}
                                    className="text-xs text-gray-700 flex items-start gap-2"
                                  >
                                    <span className="text-purple-600 mt-0.5">→</span>
                                    <span>{action}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Data Enrichment */}
            {enrichmentData && (
              <Card className="lg:col-span-2">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <SparklesIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Dados Enriquecidos
                    </h3>
                    <p className="text-sm text-gray-600">
                      Informações adicionais coletadas de fontes públicas
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {enrichmentData.data.linkedin && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">LinkedIn</h4>
                      <div className="space-y-2 text-sm">
                        {enrichmentData.data.linkedin.headline && (
                          <p className="text-gray-700">
                            <span className="text-gray-600">Cargo:</span>{" "}
                            {enrichmentData.data.linkedin.headline}
                          </p>
                        )}
                        {enrichmentData.data.linkedin.connections && (
                          <p className="text-gray-700">
                            <span className="text-gray-600">Conexões:</span>{" "}
                            {enrichmentData.data.linkedin.connections}
                          </p>
                        )}
                        {enrichmentData.data.linkedin.skills && (
                          <div>
                            <p className="text-gray-600 mb-1">Skills:</p>
                            <div className="flex flex-wrap gap-1">
                              {enrichmentData.data.linkedin.skills.map((skill, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {enrichmentData.data.company && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Empresa</h4>
                      <div className="space-y-2 text-sm">
                        {enrichmentData.data.company.industry && (
                          <p className="text-gray-700">
                            <span className="text-gray-600">Indústria:</span>{" "}
                            {enrichmentData.data.company.industry}
                          </p>
                        )}
                        {enrichmentData.data.company.size && (
                          <p className="text-gray-700">
                            <span className="text-gray-600">Tamanho:</span>{" "}
                            {enrichmentData.data.company.size}
                          </p>
                        )}
                        {enrichmentData.data.company.revenue && (
                          <p className="text-gray-700">
                            <span className="text-gray-600">Receita:</span>{" "}
                            {enrichmentData.data.company.revenue}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {enrichmentData.data.location && (
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Localização</h4>
                      <div className="space-y-2 text-sm">
                        {enrichmentData.data.location.city && (
                          <p className="text-gray-700">
                            <span className="text-gray-600">Cidade:</span>{" "}
                            {enrichmentData.data.location.city}
                          </p>
                        )}
                        {enrichmentData.data.location.country && (
                          <p className="text-gray-700">
                            <span className="text-gray-600">País:</span>{" "}
                            {enrichmentData.data.location.country}
                          </p>
                        )}
                        {enrichmentData.data.location.timezone && (
                          <p className="text-gray-700">
                            <span className="text-gray-600">Timezone:</span>{" "}
                            {enrichmentData.data.location.timezone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-600">
                    Fontes: {enrichmentData.sources.join(", ")} •{" "}
                    Atualizado em {format(new Date(enrichmentData.enrichedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
