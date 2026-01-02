/**
 * Analytics Service
 *
 * Este serviço encapsula as chamadas ao módulo de analytics do backend. Ele
 * fornece métodos para obter métricas de dashboard, séries temporais,
 * contatos de maior valor, métricas de pipeline e atividade de usuários,
 * além de permitir a exportação de contatos ou deals em formato CSV.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Obtém métricas agregadas para o dashboard【690747466847502†L12-L16】.
 *
 * @returns Objeto com contadores e indicadores (por exemplo, total de contatos, negócios, etc.).
 */
export const getDashboardMetrics = async (): Promise<any> => {
  const response = await api.get('/analytics/dashboard');
  return extractData(response);
};

/**
 * Obtém dados de série temporal para uma métrica específica【690747466847502†L21-L34】.
 *
 * @param metric Nome da métrica (por exemplo 'revenue', 'expenses', 'deals').
 * @param startDate Data de início (ISO) para a série; padrão: 30 dias atrás.
 * @param endDate Data de término (ISO) para a série; padrão: hoje.
 * @returns Array de pontos de dados agrupados por data.
 */
export const getTimeSeries = async (
  metric: string,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const params: any = { metric };
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get('/analytics/timeseries', { params });
  return extractData(response);
};

/**
 * Recupera os contatos com maior valor ou atividade, limitando o número de resultados【690747466847502†L41-L46】.
 *
 * @param limit Número máximo de contatos a retornar (default: 10).
 * @returns Array de contatos ordenados pela métrica de ranking definida no backend.
 */
export const getTopContacts = async (limit: number = 10): Promise<any[]> => {
  const response = await api.get('/analytics/top-contacts', { params: { limit } });
  return extractData(response);
};

/**
 * Obtém métricas do funil (pipeline) de vendas ou serviço【690747466847502†L52-L56】.
 *
 * @returns Dados agregados do pipeline, como contagem de etapas e valores.
 */
export const getPipelineMetrics = async (): Promise<any> => {
  const response = await api.get('/analytics/pipeline');
  return extractData(response);
};

/**
 * Consulta atividade de usuários em determinado período【690747466847502†L61-L67】.
 *
 * @param days Quantidade de dias a considerar (default: 30).
 * @returns Lista de usuários com contagem de ações realizadas no período.
 */
export const getUserActivity = async (days: number = 30): Promise<any[]> => {
  const response = await api.get('/analytics/activity', { params: { days } });
  return extractData(response);
};

/**
 * Exporta dados (contatos ou deals) em formato CSV【690747466847502†L72-L116】.
 *
 * @param type Tipo de dado a exportar ('contacts' ou 'deals').
 * @returns Conteúdo CSV em string. Cabe ao chamador tratar o download ou salvar em arquivo.
 */
export const exportData = async (type: 'contacts' | 'deals'): Promise<string> => {
  const response = await api.get(`/analytics/export/${type}`, { responseType: 'text' });
  return response.data;
};

/**
 * Obtém dados de valor de tempo de vida do cliente (CLV)【772953125256042†L451-L549】.
 *
 * @returns Objeto com clientes de maior valor, CLV médio e total.
 */
export const getCLV = async (): Promise<any> => {
  const response = await api.get('/analytics/clv');
  return extractData(response);
};

/**
 * Obtém análise de churn (taxa de abandono)【772953125256042†L451-L549】.
 *
 * @returns Dados sobre usuários inativos, taxa de churn e lista de usuários em risco.
 */
export const getChurn = async (): Promise<any> => {
  const response = await api.get('/analytics/churn');
  return extractData(response);
};

/**
 * Obtém análise de coortes (retenção)【772953125256042†L401-L447】.
 *
 * @param cohortType Agrupamento temporal (por exemplo 'monthly', 'weekly').
 * @param metric Métrica de retenção, exemplo 'active_users'.
 * @returns Dados de coorte com tamanho e métricas de retenção.
 */
export const getCohorts = async (
  cohortType?: string,
  metric?: string
): Promise<any> => {
  const params: any = {};
  if (cohortType) params.cohortType = cohortType;
  if (metric) params.metric = metric;
  const response = await api.get('/analytics/cohorts', { params });
  return extractData(response);
};

/**
 * Cria um funil personalizado【772953125256042†L298-L344】.
 *
 * @param funnel Objeto contendo nome, estágios (name e filter) e opcionalmente timeWindow.
 * @returns Objeto do funil criado.
 */
export const createFunnel = async (funnel: {
  name: string;
  stages: Array<{ name: string; filter: Record<string, any> }>;
  timeWindow?: number;
}): Promise<any> => {
  const response = await api.post('/analytics/funnels', funnel);
  return extractData(response);
};

/**
 * Analisa um funil existente, retornando contagem e conversões por estágio【772953125256042†L298-L344】.
 *
 * @param id Identificador do funil.
 * @param startDate Data inicial (ISO) opcional.
 * @param endDate Data final (ISO) opcional.
 * @returns Resultado da análise do funil.
 */
export const analyzeFunnel = async (
  id: string,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const params: any = {};
  if (startDate) params.startDate = startDate;
  if (endDate) params.endDate = endDate;
  const response = await api.get(`/analytics/funnels/${id}/analyze`, { params });
  return extractData(response);
};

/**
 * Lista relatórios personalizados【772953125256042†L43-L80】.
 *
 * @returns Lista de relatórios disponíveis.
 */
export const listReports = async (): Promise<any[]> => {
  const response = await api.get('/analytics/reports');
  return extractData(response);
};

/**
 * Cria um relatório personalizado【772953125256042†L43-L80】.
 *
 * Consulte o schema customReportSchema no backend para campos necessários.
 * @param report Definição do relatório.
 * @returns Relatório criado.
 */
export const createReport = async (report: {
  name: string;
  description?: string;
  dataSource: 'deals' | 'contacts' | 'interactions' | 'invoices' | 'users';
  metrics: Array<{ field: string; aggregation: 'count' | 'sum' | 'avg' | 'min' | 'max'; alias?: string }>;
  dimensions: string[];
  filters?: Record<string, any>;
  dateRange?: { start: string; end: string };
  visualization?: 'table' | 'bar' | 'line' | 'pie' | 'area';
  schedule?: { frequency: 'daily' | 'weekly' | 'monthly'; time: string; recipients: string[] };
}): Promise<any> => {
  const response = await api.post('/analytics/reports', report);
  return extractData(response);
};

/**
 * Executa um relatório personalizado e retorna seus resultados【772953125256042†L93-L140】.
 *
 * @param id Identificador do relatório.
 * @returns Dados do relatório executado.
 */
export const executeReport = async (id: string): Promise<any> => {
  const response = await api.get(`/analytics/reports/${id}/execute`);
  return extractData(response);
};

/**
 * Retorna a URL para exportar um relatório em PDF【772953125256042†L93-L140】.
 *
 * @param id Identificador do relatório.
 * @returns string com a URL de exportação em PDF.
 */
export const exportReportPdfUrl = (id: string): string => {
  return `/analytics/reports/${id}/export/pdf`;
};

/**
 * Retorna a URL para exportar um relatório em Excel【772953125256042†L93-L140】.
 *
 * @param id Identificador do relatório.
 * @returns string com a URL de exportação em Excel.
 */
export const exportReportExcelUrl = (id: string): string => {
  return `/analytics/reports/${id}/export/excel`;
};

/**
 * Agenda um relatório para envio periódico【772953125256042†L93-L140】.
 *
 * @param id Identificador do relatório.
 * @param schedule Objeto contendo frequência, horário e destinatários.
 * @returns Mensagem de sucesso ou dados de agenda.
 */
export const scheduleReport = async (
  id: string,
  schedule: { frequency: 'daily' | 'weekly' | 'monthly'; time: string; recipients: string[] }
): Promise<any> => {
  const response = await api.post(`/analytics/reports/${id}/schedule`, schedule);
  return extractData(response);
};