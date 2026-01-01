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