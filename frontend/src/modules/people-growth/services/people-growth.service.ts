/**
 * People Growth Service
 *
 * Este serviço fornece métodos para gerenciar gaps de desenvolvimento e
 * relatórios de equipe. O backend inclui rotas para listar gaps do
 * usuário ou equipe, detalhar e fechar gaps, sugerir trilhas de
 * aprendizagem, gerar relatórios e heatmaps, além de um endpoint para
 * recuperar o perfil de desenvolvimento do próprio usuário【449516623417123†L13-L46】【449516623417123†L132-L203】.
 */

import api, { extractData } from '../../../core/utils/api';

// ========================
// Gaps
// ========================

/**
 * Lista gaps de desenvolvimento. Supervisores e admins podem filtrar por
 * `employeeId`; usuários comuns apenas veem seus próprios gaps【449516623417123†L17-L34】.
 *
 * @param params Query params: `employeeId`, `domain`, `severity`, `status`.
 */
export const listGaps = async (
  params?: Record<string, string | number>
): Promise<any[]> => {
  const response = await api.get('/people-growth/gaps', { params });
  return extractData(response);
};

/**
 * Recupera os detalhes de um gap específico【449516623417123†L60-L83】.
 *
 * @param id ID do gap.
 */
export const getGap = async (id: string): Promise<any> => {
  const response = await api.get(`/people-growth/gaps/${id}`);
  return extractData(response);
};

/**
 * Fecha um gap concluído pelo usuário【449516623417123†L92-L103】.
 *
 * @param id ID do gap.
 */
export const closeGap = async (id: string): Promise<{ message: string }> => {
  const response = await api.post(`/people-growth/gaps/${id}/close`);
  return extractData(response);
};

/**
 * Sugere trilhas de aprendizagem para um gap【449516623417123†L111-L120】.
 *
 * @param id ID do gap.
 */
export const getGapLearningPaths = async (id: string): Promise<any[]> => {
  const response = await api.get(`/people-growth/gaps/${id}/learning-paths`);
  return extractData(response);
};

// ========================
// Relatórios e Heatmap
// ========================

/**
 * Recupera relatório de gaps da equipe (apenas supervisor ou admin)【449516623417123†L132-L147】.
 */
export const getTeamReport = async (): Promise<any> => {
  const response = await api.get('/people-growth/team/report');
  return extractData(response);
};

/**
 * Obtém heatmap de gaps por domínio e pessoa (apenas supervisor ou admin)【449516623417123†L155-L203】.
 */
export const getTeamHeatmap = async (): Promise<any[]> => {
  const response = await api.get('/people-growth/team/heatmap');
  return extractData(response);
};

// ========================
// Perfil pessoal
// ========================

/**
 * Recupera o perfil de desenvolvimento do usuário logado, incluindo total de gaps,
 * distribuição por domínio, skills, trilhas ativas e planos de desenvolvimento【449516623417123†L210-L265】.
 */
export const getMyDevelopmentProfile = async (): Promise<any> => {
  const response = await api.get('/people-growth/my-profile');
  return extractData(response);
};
