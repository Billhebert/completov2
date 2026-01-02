import { useEffect, useState } from "react";
import { AppLayout } from "../../shared/components/Layout/AppLayout";
import { Card } from "../../shared/components/UI/Card";
import { Badge } from "../../shared/components/UI/Badge";
import { LoadingSpinner } from "../../shared/components/UI/LoadingSpinner";
import { handleApiError } from "../../../core/utils/api";
import * as dealService from "../services/deal.service";
import * as dealHealthService from "../services/deal-health.service";
import * as pipelineService from "../services/pipeline.service";
import { Deal } from "../types/deal.types";
import { CrmPipeline } from "../types/pipeline.types";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";

interface DashboardStats {
  totalDeals: number;
  totalPipelineValue: number;
  wonDeals: number;
  lostDeals: number;
  conversionRate: number;
  expectedRevenue: number;
  averageDealValue: number;
  averageDealAge: number;
}

interface StageMetrics {
  stage: string;
  count: number;
  value: number;
  avgAge: number;
}

interface TopPerformer {
  ownerId: string;
  ownerName: string;
  dealsCount: number;
  totalValue: number;
  wonCount: number;
}

interface DealWithHealth extends Deal {
  health?: {
    score: number;
    status: "healthy" | "at_risk" | "critical";
    flags: string[];
  };
}

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [stageMetrics, setStageMetrics] = useState<StageMetrics[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [dealsAtRisk, setDealsAtRisk] = useState<DealWithHealth[]>([]);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);

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
      loadDashboardData();
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

  const loadDashboardData = async () => {
    setLoading(true);
    setError("");

    try {
      // Load all deals for the selected pipeline
      const dealsResult = await dealService.getDeals({
        pipelineId: selectedPipeline || undefined,
        limit: 1000, // Get all deals
      });

      const deals = dealsResult.data || [];

      // Calculate stats
      const calculatedStats = calculateStats(deals);
      setStats(calculatedStats);

      // Calculate stage metrics
      const metrics = calculateStageMetrics(deals);
      setStageMetrics(metrics);

      // Calculate top performers
      const performers = calculateTopPerformers(deals);
      setTopPerformers(performers);

      // Load deals at risk (with health data)
      await loadDealsAtRisk();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const loadDealsAtRisk = async () => {
    try {
      const healthData = await dealHealthService.getDealsHealth({
        pipelineId: selectedPipeline || undefined,
        includeClosed: false,
      });

      const atRisk = healthData.deals
        .filter((d: DealWithHealth) =>
          d.health?.status === "at_risk" || d.health?.status === "critical"
        )
        .sort((a: DealWithHealth, b: DealWithHealth) => {
          const scoreA = a.health?.score || 100;
          const scoreB = b.health?.score || 100;
          return scoreA - scoreB;
        })
        .slice(0, 5);

      setDealsAtRisk(atRisk);
    } catch (err) {
      console.error("Failed to load deals at risk:", err);
    }
  };

  const calculateStats = (deals: Deal[]): DashboardStats => {
    const totalDeals = deals.length;
    const wonDeals = deals.filter((d) => d.stage === "won").length;
    const lostDeals = deals.filter((d) => d.stage === "lost").length;
    const activeDeals = deals.filter(
      (d) => d.stage !== "won" && d.stage !== "lost"
    );

    const totalPipelineValue = activeDeals.reduce(
      (sum, d) => sum + (d.value || 0),
      0
    );
    const expectedRevenue = wonDeals.length > 0
      ? deals.filter((d) => d.stage === "won").reduce((sum, d) => sum + (d.value || 0), 0)
      : activeDeals.reduce(
          (sum, d) => sum + (d.value || 0) * ((d.probability || 50) / 100),
          0
        );

    const conversionRate = totalDeals > 0 ? (wonDeals / totalDeals) * 100 : 0;
    const averageDealValue = totalDeals > 0
      ? deals.reduce((sum, d) => sum + (d.value || 0), 0) / totalDeals
      : 0;

    // Calculate average deal age (days since creation)
    const now = new Date();
    const totalAge = activeDeals.reduce((sum, d) => {
      const created = new Date(d.createdAt || now);
      const ageInDays = Math.floor(
        (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
      );
      return sum + ageInDays;
    }, 0);
    const averageDealAge = activeDeals.length > 0 ? totalAge / activeDeals.length : 0;

    return {
      totalDeals,
      totalPipelineValue,
      wonDeals,
      lostDeals,
      conversionRate,
      expectedRevenue,
      averageDealValue,
      averageDealAge,
    };
  };

  const calculateStageMetrics = (deals: Deal[]): StageMetrics[] => {
    const stageMap = new Map<string, { count: number; value: number; ages: number[] }>();

    const now = new Date();
    deals
      .filter((d) => d.stage !== "won" && d.stage !== "lost")
      .forEach((deal) => {
        const stage = deal.stage || "unknown";
        const existing = stageMap.get(stage) || { count: 0, value: 0, ages: [] };

        const created = new Date(deal.createdAt || now);
        const ageInDays = Math.floor(
          (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
        );

        stageMap.set(stage, {
          count: existing.count + 1,
          value: existing.value + (deal.value || 0),
          ages: [...existing.ages, ageInDays],
        });
      });

    return Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage: stage.charAt(0).toUpperCase() + stage.slice(1),
      count: data.count,
      value: data.value,
      avgAge: data.ages.length > 0
        ? Math.round(data.ages.reduce((sum, age) => sum + age, 0) / data.ages.length)
        : 0,
    }));
  };

  const calculateTopPerformers = (deals: Deal[]): TopPerformer[] => {
    const performerMap = new Map<string, { dealsCount: number; totalValue: number; wonCount: number }>();

    deals.forEach((deal) => {
      const ownerId = deal.ownerId || "unassigned";
      const existing = performerMap.get(ownerId) || {
        dealsCount: 0,
        totalValue: 0,
        wonCount: 0,
      };

      performerMap.set(ownerId, {
        dealsCount: existing.dealsCount + 1,
        totalValue: existing.totalValue + (deal.value || 0),
        wonCount: existing.wonCount + (deal.stage === "won" ? 1 : 0),
      });
    });

    return Array.from(performerMap.entries())
      .map(([ownerId, data]) => ({
        ownerId,
        ownerName: ownerId === "unassigned" ? "Não Atribuído" : `User ${ownerId}`,
        ...data,
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
      .slice(0, 5);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

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
        <Card title="Dashboard Executivo">
          <div className="text-red-600">{error}</div>
        </Card>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
            <p className="text-gray-600 mt-1">Visão geral do pipeline de vendas</p>
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
          </div>
        </div>

        {/* KPI Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total de Deals</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {stats.totalDeals}
                  </p>
                  <p className="text-sm text-green-600 mt-1">
                    {stats.wonDeals} ganhos
                  </p>
                </div>
                <ChartBarIcon className="h-12 w-12 text-blue-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Valor do Pipeline</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.totalPipelineValue)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Ticket médio: {formatCurrency(stats.averageDealValue)}
                  </p>
                </div>
                <CurrencyDollarIcon className="h-12 w-12 text-green-500" />
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Taxa de Conversão</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatPercent(stats.conversionRate)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {stats.wonDeals} / {stats.totalDeals} deals
                  </p>
                </div>
                {stats.conversionRate >= 20 ? (
                  <ArrowTrendingUpIcon className="h-12 w-12 text-green-500" />
                ) : (
                  <ArrowTrendingDownIcon className="h-12 w-12 text-red-500" />
                )}
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Receita Esperada</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {formatCurrency(stats.expectedRevenue)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Idade média: {Math.round(stats.averageDealAge)} dias
                  </p>
                </div>
                <CurrencyDollarIcon className="h-12 w-12 text-purple-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pipeline Funnel */}
          <Card title="Funil de Vendas" subtitle="Deals por estágio">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip
                    formatter={(value: number, name: string) => {
                      if (name === "value") return formatCurrency(value);
                      return value;
                    }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#3b82f6" name="Quantidade" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Pipeline Value by Stage */}
          <Card title="Valor por Estágio" subtitle="Distribuição do valor">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stageMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="value" fill="#10b981" name="Valor Total" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performers */}
          <Card title="Top Performers" subtitle="Principais vendedores">
            <div className="space-y-4">
              {topPerformers.length > 0 ? (
                topPerformers.map((performer, index) => (
                  <div
                    key={performer.ownerId}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-10 h-10 bg-blue-100 text-blue-600 rounded-full font-bold">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">
                          {performer.ownerName}
                        </p>
                        <p className="text-sm text-gray-600">
                          {performer.dealsCount} deals · {performer.wonCount} ganhos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(performer.totalValue)}
                      </p>
                      <p className="text-sm text-green-600">
                        {performer.wonCount > 0
                          ? formatPercent((performer.wonCount / performer.dealsCount) * 100)
                          : "0%"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-8">
                  Nenhum dado disponível
                </p>
              )}
            </div>
          </Card>

          {/* Deals at Risk */}
          <Card
            title="Deals em Risco"
            subtitle="Requerem atenção imediata"
            actions={
              <Link
                to="/crm/deal-health"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ver todos
              </Link>
            }
          >
            <div className="space-y-4">
              {dealsAtRisk.length > 0 ? (
                dealsAtRisk.map((deal) => (
                  <Link
                    key={deal.id}
                    to={`/crm/deals/${deal.id}`}
                    className="block p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-600" />
                          <p className="font-semibold text-gray-900">
                            {deal.title}
                          </p>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {formatCurrency(deal.value || 0)} · {deal.stage}
                        </p>
                        {deal.health?.flags && deal.health.flags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {deal.health.flags.slice(0, 2).map((flag, idx) => (
                              <Badge key={idx} variant="danger">
                                {flag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={
                          deal.health?.status === "critical"
                            ? "danger"
                            : "warning"
                        }
                      >
                        {deal.health?.status === "critical"
                          ? "Crítico"
                          : "Em Risco"}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-500">Todos os deals estão saudáveis!</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Stage Age Distribution */}
        <Card title="Idade Média por Estágio" subtitle="Tempo médio no pipeline">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stageMetrics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis label={{ value: "Dias", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(value: number) => `${value} dias`} />
                <Legend />
                <Bar dataKey="avgAge" fill="#f59e0b" name="Idade Média (dias)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default DashboardPage;
