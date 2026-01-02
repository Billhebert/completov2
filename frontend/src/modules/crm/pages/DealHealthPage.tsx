import { useEffect, useState } from "react";
import { AppLayout } from "../../shared/components/Layout/AppLayout";
import { Card } from "../../shared/components/UI/Card";
import { Badge } from "../../shared/components/UI/Badge";
import { Button } from "../../shared/components/UI/Button";
import { LoadingSpinner } from "../../shared/components/UI/LoadingSpinner";
import { handleApiError } from "../../../core/utils/api";
import * as dealHealthService from "../services/deal-health.service";
import * as pipelineService from "../services/pipeline.service";
import { Deal } from "../types/deal.types";
import { CrmPipeline } from "../types/pipeline.types";
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  FireIcon,
  ShieldExclamationIcon,
  ChartBarIcon,
  CalendarIcon,
  ChatBubbleLeftIcon,
} from "@heroicons/react/24/outline";
import { format, isPast, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface DealWithHealth extends Deal {
  health?: {
    score: number;
    status: "healthy" | "at_risk" | "critical";
    flags: string[];
    issues?: {
      type: string;
      severity: "low" | "medium" | "high";
      message: string;
      recommendation?: string;
    }[];
  };
}

interface HealthSummary {
  total: number;
  healthy: number;
  atRisk: number;
  critical: number;
  averageScore: number;
}

const DealHealthPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deals, setDeals] = useState<DealWithHealth[]>([]);
  const [summary, setSummary] = useState<HealthSummary | null>(null);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"score" | "value" | "age">("score");

  useEffect(() => {
    loadPipelines();
  }, []);

  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipeline) {
      const defaultPipeline = pipelines.find((p) => p.isDefault) || pipelines[0];
      setSelectedPipeline(defaultPipeline.id);
    }
  }, [pipelines]);

  useEffect(() => {
    if (selectedPipeline) {
      loadHealthData();
    }
  }, [selectedPipeline]);

  const loadPipelines = async () => {
    try {
      const result = await pipelineService.listPipelines();
      setPipelines(result);
    } catch (err) {
      console.error("Failed to load pipelines:", err);
    }
  };

  const loadHealthData = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await dealHealthService.getDealsHealth({
        pipelineId: selectedPipeline || undefined,
        includeClosed: false,
      });

      setDeals(result.deals || []);
      calculateSummary(result.deals || []);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const calculateSummary = (dealsData: DealWithHealth[]) => {
    const total = dealsData.length;
    const healthy = dealsData.filter((d) => d.health?.status === "healthy").length;
    const atRisk = dealsData.filter((d) => d.health?.status === "at_risk").length;
    const critical = dealsData.filter((d) => d.health?.status === "critical").length;
    const averageScore =
      total > 0
        ? dealsData.reduce((sum, d) => sum + (d.health?.score || 100), 0) / total
        : 100;

    setSummary({
      total,
      healthy,
      atRisk,
      critical,
      averageScore,
    });
  };

  const getFilteredAndSortedDeals = () => {
    let filtered = deals;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((d) => d.health?.status === filterStatus);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "score":
          return (a.health?.score || 100) - (b.health?.score || 100);
        case "value":
          return (b.value || 0) - (a.value || 0);
        case "age":
          return getDealAge(b) - getDealAge(a);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const getDealAge = (deal: Deal): number => {
    if (!deal.createdAt) return 0;
    return differenceInDays(new Date(), new Date(deal.createdAt));
  };

  const getHealthBadge = (status?: string) => {
    switch (status) {
      case "healthy":
        return <Badge variant="success">Saudável</Badge>;
      case "at_risk":
        return <Badge variant="warning">Em Risco</Badge>;
      case "critical":
        return <Badge variant="danger">Crítico</Badge>;
      default:
        return <Badge variant="default">Desconhecido</Badge>;
    }
  };

  const getHealthIcon = (status?: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case "at_risk":
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case "critical":
        return <FireIcon className="h-6 w-6 text-red-500" />;
      default:
        return <ShieldExclamationIcon className="h-6 w-6 text-gray-500" />;
    }
  };

  const getRecommendations = (deal: DealWithHealth): string[] => {
    const recommendations: string[] = [];
    const flags = deal.health?.flags || [];

    if (flags.includes("no_activity")) {
      recommendations.push("Agende uma reunião ou ligação com o cliente");
    }
    if (flags.includes("stale")) {
      recommendations.push("Revise o status do deal e atualize informações");
    }
    if (flags.includes("overdue")) {
      recommendations.push("Reavalie a data de fechamento ou acelere as negociações");
    }
    if (flags.includes("low_probability")) {
      recommendations.push("Analise os impedimentos e ajuste a estratégia");
    }
    if (flags.includes("high_value_at_risk")) {
      recommendations.push("URGENTE: Deal de alto valor requer atenção imediata");
    }

    return recommendations;
  };

  const pieChartData = summary
    ? [
        { name: "Saudáveis", value: summary.healthy, color: "#10b981" },
        { name: "Em Risco", value: summary.atRisk, color: "#f59e0b" },
        { name: "Críticos", value: summary.critical, color: "#ef4444" },
      ].filter((item) => item.value > 0)
    : [];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <Card title="Deal Health Dashboard">
          <div className="text-red-600">{error}</div>
        </Card>
      </AppLayout>
    );
  }

  const filteredDeals = getFilteredAndSortedDeals();

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Deal Health Dashboard
            </h1>
            <p className="text-gray-600 mt-1">
              Monitore a saúde dos deals e identifique riscos
            </p>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedPipeline || ""}
              onChange={(e) => setSelectedPipeline(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {pipelines.map((pipeline) => (
                <option key={pipeline.id} value={pipeline.id}>
                  {pipeline.name}
                </option>
              ))}
            </select>
            <Link to="/crm/deal-health-rules">
              <Button variant="secondary">Configurar Regras</Button>
            </Link>
          </div>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Deals</p>
                  <p className="text-3xl font-bold text-gray-900">{summary.total}</p>
                </div>
                <ChartBarIcon className="h-10 w-10 text-blue-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Saudáveis</p>
                  <p className="text-3xl font-bold text-green-600">
                    {summary.healthy}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.total > 0
                      ? `${((summary.healthy / summary.total) * 100).toFixed(0)}%`
                      : "0%"}
                  </p>
                </div>
                <CheckCircleIcon className="h-10 w-10 text-green-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Em Risco</p>
                  <p className="text-3xl font-bold text-yellow-600">
                    {summary.atRisk}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.total > 0
                      ? `${((summary.atRisk / summary.total) * 100).toFixed(0)}%`
                      : "0%"}
                  </p>
                </div>
                <ExclamationTriangleIcon className="h-10 w-10 text-yellow-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Críticos</p>
                  <p className="text-3xl font-bold text-red-600">
                    {summary.critical}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {summary.total > 0
                      ? `${((summary.critical / summary.total) * 100).toFixed(0)}%`
                      : "0%"}
                  </p>
                </div>
                <FireIcon className="h-10 w-10 text-red-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Score Médio</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {Math.round(summary.averageScore)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">de 100 pontos</p>
                </div>
                <ShieldExclamationIcon className="h-10 w-10 text-blue-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Distribution Chart */}
        {pieChartData.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card title="Distribuição de Saúde" className="lg:col-span-1">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Quick Stats */}
            <Card title="Alertas Principais" className="lg:col-span-2">
              <div className="space-y-3">
                {summary && summary.critical > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <FireIcon className="h-6 w-6 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">
                        {summary.critical} deals críticos requerem atenção imediata
                      </p>
                      <p className="text-sm text-red-700">
                        Estes deals têm alta probabilidade de serem perdidos sem ação
                        rápida
                      </p>
                    </div>
                  </div>
                )}

                {summary && summary.atRisk > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-yellow-900">
                        {summary.atRisk} deals em risco precisam de atenção
                      </p>
                      <p className="text-sm text-yellow-700">
                        Revise estes deals para evitar que se tornem críticos
                      </p>
                    </div>
                  </div>
                )}

                {summary && summary.healthy === summary.total && summary.total > 0 && (
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                    <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-900">
                        Excelente! Todos os deals estão saudáveis
                      </p>
                      <p className="text-sm text-green-700">
                        Continue monitorando para manter a saúde do pipeline
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Filters and Sort */}
        <Card>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <label className="text-sm text-gray-600 mr-2">Filtrar por:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Todos os status</option>
                <option value="critical">Críticos</option>
                <option value="at_risk">Em Risco</option>
                <option value="healthy">Saudáveis</option>
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-600 mr-2">Ordenar por:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="score">Score de Saúde</option>
                <option value="value">Valor do Deal</option>
                <option value="age">Idade no Pipeline</option>
              </select>
            </div>
            <div className="ml-auto text-sm text-gray-600">
              Mostrando {filteredDeals.length} de {deals.length} deals
            </div>
          </div>
        </Card>

        {/* Deals List */}
        <div className="space-y-4">
          {filteredDeals.length > 0 ? (
            filteredDeals.map((deal) => (
              <Card key={deal.id}>
                <div className="flex items-start gap-4">
                  {/* Health Icon */}
                  <div className="flex-shrink-0">
                    {getHealthIcon(deal.health?.status)}
                  </div>

                  {/* Deal Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <Link
                          to={`/crm/deals/${deal.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600"
                        >
                          {deal.title}
                        </Link>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <ChartBarIcon className="h-4 w-4" />
                            {deal.stage}
                          </span>
                          <span>{formatCurrency(deal.value || 0)}</span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="h-4 w-4" />
                            {getDealAge(deal)} dias
                          </span>
                          {deal.expectedCloseDate && (
                            <span
                              className={`flex items-center gap-1 ${
                                isPast(new Date(deal.expectedCloseDate))
                                  ? "text-red-600 font-semibold"
                                  : ""
                              }`}
                            >
                              <CalendarIcon className="h-4 w-4" />
                              Fechamento:{" "}
                              {format(
                                new Date(deal.expectedCloseDate),
                                "dd/MM/yyyy",
                                { locale: ptBR }
                              )}
                              {isPast(new Date(deal.expectedCloseDate)) && " (atrasado)"}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getHealthBadge(deal.health?.status)}
                        <div className="text-right">
                          <p className="text-2xl font-bold text-gray-900">
                            {deal.health?.score || 100}
                          </p>
                          <p className="text-xs text-gray-600">score</p>
                        </div>
                      </div>
                    </div>

                    {/* Flags */}
                    {deal.health?.flags && deal.health.flags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {deal.health.flags.map((flag, idx) => (
                          <Badge key={idx} variant="default">
                            {flag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Recommendations */}
                    {getRecommendations(deal).length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-3">
                        <p className="font-semibold text-blue-900 text-sm mb-2 flex items-center gap-2">
                          <ChatBubbleLeftIcon className="h-4 w-4" />
                          Recomendações:
                        </p>
                        <ul className="space-y-1">
                          {getRecommendations(deal).map((rec, idx) => (
                            <li
                              key={idx}
                              className="text-sm text-blue-800 flex items-start gap-2"
                            >
                              <span className="text-blue-600 mt-1">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card>
              <div className="text-center py-12">
                <CheckCircleIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  {filterStatus === "all"
                    ? "Nenhum deal encontrado"
                    : "Nenhum deal com este status"}
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default DealHealthPage;
