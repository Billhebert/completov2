/**
 * Analytics Service
 * TODO: Implementar serviço de analytics e relatórios
 */

import api, { extractData } from '../../../core/utils/api';
import { Metric, ChartData, Report } from '../types';

/**
 * TODO: Buscar métricas principais
 * - Filtrar por período (hoje, semana, mês, ano)
 * - Calcular variação vs período anterior
 */
export const getMetrics = async (period?: string): Promise<Metric[]> => {
  const response = await api.get('/analytics/metrics', { params: { period } });
  return extractData(response);
};

/**
 * TODO: Buscar dados para gráficos
 * - Suportar diferentes tipos (linha, barra, pizza)
 * - Agrupar por período (dia, semana, mês)
 */
export const getChartData = async (
  type: string,
  period: string
): Promise<ChartData> => {
  const response = await api.get('/analytics/charts', {
    params: { type, period },
  });
  return extractData(response);
};

/**
 * TODO: Gerar relatório
 * - Suportar diferentes tipos
 * - Exportar em PDF/Excel
 */
export const generateReport = async (type: string, filters?: Record<string, unknown>): Promise<Report> => {
  const response = await api.post('/analytics/reports', { type, filters });
  return extractData(response);
};

/**
 * TODO: Registrar evento customizado
 */
export const trackEvent = async (event: string, properties?: Record<string, unknown>): Promise<void> => {
  await api.post('/analytics/events', { event, properties });
};
