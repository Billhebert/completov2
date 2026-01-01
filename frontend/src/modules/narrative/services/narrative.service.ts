/**
 * Narrative Reports Service
 * Relatórios narrativos gerados por IA
 */

import api, { extractData } from '../../../core/utils/api';
import { NarrativeReport, ReportTemplate } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * Lista relatórios narrativos
 * TODO: Implementar biblioteca de relatórios
 * - Listar relatórios gerados
 * - Filtrar por período e tipo
 * - Busca full-text no conteúdo
 * - Compartilhamento e exportação
 */
export const getReports = async (params?: PaginationParams): Promise<PaginatedResult<NarrativeReport>> => {
  const response = await api.get('/narrative/reports', { params });
  return extractData(response);
};

/**
 * Gerar relatório narrativo
 * TODO: Implementar geração com LLM
 * - Usar GPT-4/Claude para gerar narrativa
 * - Analisar dados automaticamente
 * - Identificar insights e tendências
 * - Gerar texto em linguagem natural
 * - Incluir visualizações relevantes
 * - Customizar tom e estilo
 */
export const generateReport = async (type: string, filters?: Record<string, unknown>): Promise<NarrativeReport> => {
  const response = await api.post('/narrative/reports/generate', { type, filters });
  return extractData(response);
};

/**
 * Regenerar seção do relatório
 * TODO: Implementar edição assistida
 * - Regenerar seção específica
 * - Ajustar tom ou foco
 * - Adicionar/remover insights
 * - Expandir ou resumir
 */
export const regenerateSection = async (reportId: string, sectionId: string, instructions?: string): Promise<NarrativeReport> => {
  const response = await api.post(\`/narrative/reports/\${reportId}/sections/\${sectionId}/regenerate\`, { instructions });
  return extractData(response);
};

/**
 * Listar templates de relatório
 * TODO: Implementar templates customizáveis
 * - Templates pré-configurados
 * - Seções padrão
 * - Customizar estrutura
 * - Salvar templates personalizados
 */
export const getTemplates = async (): Promise<ReportTemplate[]> => {
  const response = await api.get('/narrative/templates');
  return extractData(response);
};
