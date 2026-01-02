import { useEffect, useState } from "react";
import { AppLayout } from "../../shared/components/Layout/AppLayout";
import { Card } from "../../shared/components/UI/Card";
import { Button } from "../../shared/components/UI/Button";
import { Badge } from "../../shared/components/UI/Badge";
import { LoadingSpinner } from "../../shared/components/UI/LoadingSpinner";
import { handleApiError } from "../../../core/utils/api";
import * as dealService from "../services/deal.service";
import * as pipelineService from "../services/pipeline.service";
import { Deal } from "../types/deal.types";
import { CrmPipeline } from "../types/pipeline.types";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
} from "recharts";
import {
  ArrowDownTrayIcon,
  ChartBarIcon,
  CalendarIcon,
  CurrencyDollarIcon,
} from "@heroicons/react/24/outline";
import { format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ConversionData {
  stage: string;
  count: number;
  converted: number;
  conversionRate: number;
  avgDaysInStage: number;
}

interface MonthlyRevenue {
  month: string;
  actual: number;
  predicted: number;
  deals: number;
}

interface WinLossData {
  period: string;
  won: number;
  lost: number;
  winRate: number;
}

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deals, setDeals] = useState<Deal[]>([]);
  const [pipelines, setPipelines] = useState<CrmPipeline[]>([]);
  const [selectedPipeline, setSelectedPipeline] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<"30d" | "90d" | "6m" | "1y">("90d");

  // Analytics data
  const [conversionData, setConversionData] = useState<ConversionData[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<MonthlyRevenue[]>([]);
  const [winLossData, setWinLossData] = useState<WinLossData[]>([]);
  const [pipelineVelocity, setPipelineVelocity] = useState<number>(0);
  const [avgDealSize, setAvgDealSize] = useState<number>(0);

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
      loadAnalytics();
    }
  }, [selectedPipeline, dateRange]);

  const loadPipelines = async () => {
    try {
      const result = await pipelineService.listPipelines();
      setPipelines(result);
    } catch (err) {
      console.error("Failed to load pipelines:", err);
    }
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      // Load all deals
      const dealsResult = await dealService.getDeals({
        pipelineId: selectedPipeline || undefined,
        limit: 1000,
      });

      const allDeals = dealsResult.data || [];
      setDeals(allDeals);

      // Calculate analytics
      calculateConversionData(allDeals);
      calculateMonthlyRevenue(allDeals);
      calculateWinLossData(allDeals);
      calculatePipelineMetrics(allDeals);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const calculateConversionData = (allDeals: Deal[]) => {
    const stageMap = new Map<string, { total: number; converted: number; days: number[] }>();

    allDeals.forEach((deal) => {
      const stage = deal.stage || "unknown";
      const existing = stageMap.get(stage) || { total: 0, converted: 0, days: [] };

      existing.total += 1;
      if (deal.stage === "won") {
        existing.converted += 1;
      }

      // Calculate days in stage
      if (deal.createdAt) {
        const created = new Date(deal.createdAt);
        const now = new Date();
        const days = differenceInDays(now, created);
        existing.days.push(days);
      }

      stageMap.set(stage, existing);
    });

    const data: ConversionData[] = Array.from(stageMap.entries())
      .filter(([stage]) => stage !== "won" && stage !== "lost")
      .map(([stage, stats]) => ({
        stage: stage.charAt(0).toUpperCase() + stage.slice(1),
        count: stats.total,
        converted: stats.converted,
        conversionRate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0,
        avgDaysInStage: stats.days.length > 0
          ? Math.round(stats.days.reduce((sum, d) => sum + d, 0) / stats.days.length)
          : 0,
      }));

    setConversionData(data);
  };

  const calculateMonthlyRevenue = (allDeals: Deal[]) => {
    const months = getDaysRange();
    const monthlyData: MonthlyRevenue[] = [];

    months.forEach((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthDeals = allDeals.filter((deal) => {
        if (!deal.createdAt) return false;
        const created = new Date(deal.createdAt);
        return created >= monthStart && created <= monthEnd;
      });

      const wonDeals = monthDeals.filter((d) => d.stage === "won");
      const actualRevenue = wonDeals.reduce((sum, d) => sum + (d.value || 0), 0);

      const activeDeals = monthDeals.filter((d) => d.stage !== "won" && d.stage !== "lost");
      const predictedRevenue = activeDeals.reduce(
        (sum, d) => sum + (d.value || 0) * ((d.probability || 50) / 100),
        0
      );

      monthlyData.push({
        month: format(month, "MMM/yy", { locale: ptBR }),
        actual: actualRevenue,
        predicted: predictedRevenue,
        deals: monthDeals.length,
      });
    });

    setMonthlyRevenue(monthlyData);
  };

  const calculateWinLossData = (allDeals: Deal[]) => {
    const months = getDaysRange();
    const data: WinLossData[] = [];

    months.forEach((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthDeals = allDeals.filter((deal) => {
        if (!deal.updatedAt) return false;
        const updated = new Date(deal.updatedAt);
        return updated >= monthStart && updated <= monthEnd;
      });

      const won = monthDeals.filter((d) => d.stage === "won").length;
      const lost = monthDeals.filter((d) => d.stage === "lost").length;
      const total = won + lost;
      const winRate = total > 0 ? (won / total) * 100 : 0;

      data.push({
        period: format(month, "MMM/yy", { locale: ptBR }),
        won,
        lost,
        winRate,
      });
    });

    setWinLossData(data);
  };

  const calculatePipelineMetrics = (allDeals: Deal[]) => {
    // Average deal size
    const closedDeals = allDeals.filter((d) => d.stage === "won" || d.stage === "lost");
    const avgSize = closedDeals.length > 0
      ? closedDeals.reduce((sum, d) => sum + (d.value || 0), 0) / closedDeals.length
      : 0;
    setAvgDealSize(avgSize);

    // Pipeline velocity (average days to close)
    const wonDeals = allDeals.filter((d) => d.stage === "won" && d.createdAt && d.updatedAt);
    if (wonDeals.length > 0) {
      const totalDays = wonDeals.reduce((sum, deal) => {
        const created = new Date(deal.createdAt!);
        const updated = new Date(deal.updatedAt!);
        return sum + differenceInDays(updated, created);
      }, 0);
      setPipelineVelocity(Math.round(totalDays / wonDeals.length));
    } else {
      setPipelineVelocity(0);
    }
  };

  const getDaysRange = () => {
    const now = new Date();
    let start: Date;

    switch (dateRange) {
      case "30d":
        start = subMonths(now, 1);
        break;
      case "90d":
        start = subMonths(now, 3);
        break;
      case "6m":
        start = subMonths(now, 6);
        break;
      case "1y":
        start = subMonths(now, 12);
        break;
      default:
        start = subMonths(now, 3);
    }

    return eachMonthOfInterval({ start, end: now });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const handleExportPDF = () => {
    alert("Exportação PDF será implementada em breve!");
  };

  const handleExportExcel = () => {
    alert("Exportação Excel será implementada em breve!");
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Analytics & Relatórios</h1>
            <p className="text-gray-600 mt-1">Análises avançadas do pipeline de vendas</p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="6m">Últimos 6 meses</option>
              <option value="1y">Último ano</option>
            </select>
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
            <Button variant="secondary" onClick={handleExportPDF}>
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export PDF
            </Button>
            <Button variant="secondary" onClick={handleExportExcel}>
              <ArrowDownTrayIcon className="h-5 w-5 mr-2" />
              Export Excel
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Velocidade do Pipeline</p>
                <p className="text-3xl font-bold text-gray-900">{pipelineVelocity}</p>
                <p className="text-xs text-gray-500 mt-1">dias para fechar</p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Ticket Médio</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(avgDealSize)}
                </p>
              </div>
              <CurrencyDollarIcon className="h-10 w-10 text-green-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Taxa de Ganho Global</p>
                <p className="text-3xl font-bold text-blue-600">
                  {deals.length > 0
                    ? (
                        (deals.filter((d) => d.stage === "won").length /
                          deals.filter((d) => d.stage === "won" || d.stage === "lost")
                            .length) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </p>
              </div>
              <ChartBarIcon className="h-10 w-10 text-blue-500" />
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Deals Analisados</p>
                <p className="text-3xl font-bold text-purple-600">{deals.length}</p>
              </div>
              <CalendarIcon className="h-10 w-10 text-purple-500" />
            </div>
          </Card>
        </div>

        {/* Monthly Revenue Forecast */}
        <Card title="Receita Mensal: Realizada vs Prevista">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="predicted"
                  fill="#93c5fd"
                  stroke="#3b82f6"
                  name="Receita Prevista"
                />
                <Bar dataKey="actual" fill="#10b981" name="Receita Realizada" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion by Stage */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Taxa de Conversão por Estágio">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Bar dataKey="conversionRate" fill="#10b981" name="Taxa de Conversão (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Tempo Médio por Estágio">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="stage" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${value} dias`} />
                  <Legend />
                  <Bar dataKey="avgDaysInStage" fill="#f59e0b" name="Dias no Estágio" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>

        {/* Win/Loss Analysis */}
        <Card title="Análise de Ganhos e Perdas">
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={winLossData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="won"
                  stroke="#10b981"
                  name="Deals Ganhos"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="lost"
                  stroke="#ef4444"
                  name="Deals Perdidos"
                  strokeWidth={2}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="winRate"
                  stroke="#3b82f6"
                  name="Taxa de Ganho (%)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Detailed Stats Table */}
        <Card title="Estatísticas Detalhadas por Estágio">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estágio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total de Deals
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Convertidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Taxa de Conversão
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tempo Médio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {conversionData.map((stage) => (
                  <tr key={stage.stage}>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                      {stage.stage}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {stage.count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {stage.converted}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          stage.conversionRate >= 50
                            ? "success"
                            : stage.conversionRate >= 25
                            ? "warning"
                            : "danger"
                        }
                      >
                        {stage.conversionRate.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                      {stage.avgDaysInStage} dias
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AppLayout>
  );
};

export default AnalyticsPage;
