/**
 * Deal Detail Page
 * Página de detalhes do deal com probabilidade IA
 */

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppLayout, Card, Button, Breadcrumbs } from "../../shared";
import { handleApiError } from "../../../core/utils/api";
import * as dealService from "../services/deal.service";
import * as aiService from "../services/ai.service";
import * as interactionService from "../services/interaction.service";
import type { Deal } from "../types/deal.types";
import type { DealProbability } from "../services/ai.service";
import type { Interaction } from "../services/interaction.service";
import { formatDistanceToNow, format } from "date-fns";
import { ptBR } from "date-fns/locale";

function getDealStageLabel(stage: string): string {
  const map: Record<string, string> = {
    lead: "Lead",
    qualified: "Qualificado",
    proposal: "Proposta",
    negotiation: "Negociação",
    won: "Ganho",
    lost: "Perdido",
  };
  return map[stage] || stage;
}

function getDealStageColor(stage: string): string {
  const map: Record<string, string> = {
    lead: "bg-blue-100 text-blue-800",
    qualified: "bg-indigo-100 text-indigo-800",
    proposal: "bg-purple-100 text-purple-800",
    negotiation: "bg-yellow-100 text-yellow-800",
    won: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
  };
  return map[stage] || "bg-gray-100 text-gray-800";
}

export default function DealDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [probability, setProbability] = useState<DealProbability | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingProbability, setIsLoadingProbability] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    loadDealDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadDealDetails = async () => {
    if (!id) return;

    setIsLoading(true);
    setError("");

    try {
      const [dealData, interactionsData] = await Promise.all([
        dealService.getDealById(id),
        interactionService
          .getInteractions({ dealId: id, limit: 50 })
          .catch(() => []),
      ]);

      setDeal(dealData);
      setInteractions(interactionsData);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadProbability = async () => {
    if (!id) return;

    setIsLoadingProbability(true);

    try {
      const probabilityData = await aiService.getDealProbability(id);
      setProbability(probabilityData);
    } catch (err) {
      // Se a rota não existir, ignora o erro
      console.warn("AI probability not available:", err);
      setProbability(null);
    } finally {
      setIsLoadingProbability(false);
    }
  };

  useEffect(() => {
    if (deal) {
      loadProbability();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="page-container">
          <Card className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-600">Carregando negociação...</p>
          </Card>
        </div>
      </AppLayout>
    );
  }

  if (error || !deal) {
    return (
      <AppLayout>
        <div className="page-container">
          <Card className="p-8 text-center">
            <h3 className="text-lg font-medium text-red-600 mb-2">
              Erro ao carregar negociação
            </h3>
            <p className="text-gray-600 mb-4">
              {error || "Negociação não encontrada"}
            </p>
            <Button onClick={() => navigate("/crm/deals")}>
              Voltar para negociações
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
            { label: "Negociações", path: "/crm/deals" },
            { label: deal.title },
          ]}
          className="mb-4"
        />

        {/* Header do deal */}
        <Card className="mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{deal.title}</h1>
                <span
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDealStageColor(
                    deal.stage
                  )}`}
                >
                  {getDealStageLabel(deal.stage)}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-6">
                <div>
                  <p className="text-sm text-gray-500">Valor</p>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: deal.currency || "BRL",
                    }).format(deal.value)}
                  </p>
                </div>

                {deal.expectedCloseDate && (
                  <div>
                    <p className="text-sm text-gray-500">Fechamento esperado</p>
                    <p className="text-lg font-medium text-gray-900">
                      {format(new Date(deal.expectedCloseDate), "dd/MM/yyyy")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(deal.expectedCloseDate), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                )}

                {deal.probability !== undefined && (
                  <div>
                    <p className="text-sm text-gray-500">Probabilidade</p>
                    <p className="text-lg font-medium text-gray-900">
                      {deal.probability}%
                    </p>
                  </div>
                )}
              </div>

              {deal.description && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm text-gray-500 mb-1">Descrição</p>
                  <p className="text-gray-900">{deal.description}</p>
                </div>
              )}
            </div>

            <Button variant="secondary" onClick={() => navigate("/crm/deals")}>
              Voltar
            </Button>
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* AI Probability */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Probabilidade IA
                </h2>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={loadProbability}
                  disabled={isLoadingProbability}
                >
                  {isLoadingProbability ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                  ) : (
                    "🔄"
                  )}
                </Button>
              </div>

              {isLoadingProbability ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : probability ? (
                <div>
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">
                        Probabilidade de fechamento
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {probability.score}%
                      </span>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-blue-600 h-3 rounded-full transition-all"
                        style={{ width: `${probability.score}%` }}
                      />
                    </div>
                  </div>

                  {probability.factors && probability.factors.length > 0 && (
                    <div className="space-y-3 pt-4 border-t border-gray-200">
                      <h3 className="text-sm font-medium text-gray-900">
                        Fatores de análise
                      </h3>
                      {probability.factors.map((factor, idx) => (
                        <div key={idx} className="text-sm">
                          <div className="flex items-start gap-2">
                            <span
                              className={`mt-0.5 ${
                                factor.impact === "positive"
                                  ? "text-green-500"
                                  : factor.impact === "negative"
                                    ? "text-red-500"
                                    : "text-gray-500"
                              }`}
                            >
                              {factor.impact === "positive"
                                ? "✓"
                                : factor.impact === "negative"
                                  ? "✗"
                                  : "•"}
                            </span>
                            <p className="text-gray-700">{factor.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {probability.recommendations &&
                    probability.recommendations.length > 0 && (
                      <div className="space-y-2 pt-4 border-t border-gray-200 mt-4">
                        <h3 className="text-sm font-medium text-gray-900">
                          Recomendações
                        </h3>
                        <ul className="space-y-2">
                          {probability.recommendations.map((rec, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-gray-600 flex items-start gap-2"
                            >
                              <span className="text-blue-500 mt-0.5">→</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <p>Análise de probabilidade IA não disponível.</p>
                  <p className="mt-2 text-xs text-gray-400">
                    A análise IA será implementada em breve.
                  </p>
                </div>
              )}
            </Card>

            {/* Quick Stats */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Estatísticas
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Interações</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {interactions.length}
                  </span>
                </div>

                {deal.createdAt && (
                  <div className="pt-4 border-t border-gray-200">
                    <span className="text-gray-600 text-sm">Criado em</span>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      {format(new Date(deal.createdAt), "dd/MM/yyyy")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDistanceToNow(new Date(deal.createdAt), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Timeline de Interações */}
          <div className="lg:col-span-2">
            <Card>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Histórico de interações
              </h2>

              {interactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Nenhuma interação registrada ainda.
                  </p>
                  <p className="text-sm text-gray-400 mt-2">
                    Registre interações para acompanhar o progresso desta
                    negociação.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {interactions.map((interaction) => (
                    <div key={interaction.id} className="flex">
                      <div className="flex-shrink-0 mr-4">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-lg">
                          {interaction.type === "call"
                            ? "📞"
                            : interaction.type === "email"
                              ? "📧"
                              : interaction.type === "meeting"
                                ? "🤝"
                                : "📝"}
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-gray-900">
                              {interaction.subject ||
                                (interaction.type === "call"
                                  ? "Ligação"
                                  : interaction.type === "email"
                                    ? "Email"
                                    : interaction.type === "meeting"
                                      ? "Reunião"
                                      : "Nota")}
                            </h3>
                            <p className="text-sm text-gray-600 mt-1">
                              {interaction.content}
                            </p>
                            {interaction.user && (
                              <p className="text-xs text-gray-500 mt-2">
                                por {interaction.user.name}
                              </p>
                            )}
                          </div>

                          <span className="text-xs text-gray-500 ml-4 flex-shrink-0">
                            {formatDistanceToNow(new Date(interaction.timestamp), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
