/**
 * Analytics Service
 *
 * Serviço para análises e relatórios do CRM.
 */

import api, { extractData } from '../../../core/utils/api';

export interface PipelineStageData {
  stage: string;
  _count: number;
  _sum: {
    value: number | null;
  };
}

export interface PipelineSummary {
  data: PipelineStageData[];
}

/**
 * Obtém resumo do pipeline de vendas agrupado por estágio
 */
export const getPipelineSummary = async (): Promise<PipelineStageData[]> => {
  const response = await api.get('/crm/analytics/pipeline');
  return extractData(response);
};

export default {
  getPipelineSummary,
};
