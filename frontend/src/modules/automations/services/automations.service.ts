/**
 * Automations Service
 *
 * Fornece métodos de alto nível para interagir com o módulo de automações do backend. O
 * backend implementa a lógica de workflows (criação, ativação, pausa, execução, listagem)
 * no arquivo `backend/src/modules/automations/index.ts`, incluindo endpoints para listar e
 * gerenciar execuções, testar workflows e obter sugestões alimentadas por IA【577705282484866†L27-L63】.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Lista workflows existentes com filtros opcionais por status e paginação.
 *
 * @param params Objeto de consulta (por exemplo, `{ status: 'ACTIVE' }`).
 */
export const getWorkflows = async (
  params?: Record<string, string | number | boolean>
): Promise<any[]> => {
  const response = await api.get('/automations/workflows', { params });
  return extractData(response);
};

/**
 * Recupera detalhes de um workflow específico, incluindo últimas execuções【577705282484866†L62-L88】.
 *
 * @param id ID do workflow a ser buscado.
 */
export const getWorkflow = async (id: string): Promise<any> => {
  const response = await api.get(`/automations/workflows/${id}`);
  return extractData(response);
};

/**
 * Cria um novo workflow. É necessário que o usuário tenha as permissões adequadas (admin ou supervisor)【577705282484866†L94-L115】.
 *
 * @param data Objeto contendo `name`, `description` e `definition` (nodes e edges).
 */
export const createWorkflow = async (data: any): Promise<any> => {
  const response = await api.post('/automations/workflows', data);
  return extractData(response);
};

/**
 * Atualiza um workflow existente. Somente admins/supervisores podem atualizar workflows【577705282484866†L134-L161】.
 *
 * @param id ID do workflow.
 * @param data Dados parciais com `name`, `description` ou `definition` para atualização.
 */
export const updateWorkflow = async (id: string, data: any): Promise<any> => {
  const response = await api.patch(`/automations/workflows/${id}`, data);
  return extractData(response);
};

/**
 * Remove um workflow permanentemente【577705282484866†L171-L196】.
 *
 * @param id ID do workflow a ser removido.
 */
export const deleteWorkflow = async (id: string): Promise<void> => {
  await api.delete(`/automations/workflows/${id}`);
};

/**
 * Ativa um workflow para que ele responda a eventos e seja executado automaticamente【577705282484866†L204-L223】.
 *
 * @param id ID do workflow.
 */
export const activateWorkflow = async (id: string): Promise<any> => {
  const response = await api.post(`/automations/workflows/${id}/activate`);
  return extractData(response);
};

/**
 * Pausa a execução de um workflow. O workflow permanece salvo mas não será executado até ser reativado【577705282484866†L230-L249】.
 *
 * @param id ID do workflow.
 */
export const pauseWorkflow = async (id: string): Promise<any> => {
  const response = await api.post(`/automations/workflows/${id}/pause`);
  return extractData(response);
};

/**
 * Executa um workflow manualmente para testes【577705282484866†L258-L289】.
 *
 * @param id ID do workflow.
 * @param testData Objeto com dados de contexto para a execução de teste.
 */
export const testWorkflow = async (id: string, testData?: any): Promise<any> => {
  const response = await api.post(`/automations/workflows/${id}/test`, { testData });
  return extractData(response);
};

/**
 * Lista execuções de workflows com filtro opcional por workflowId, status, limite e offset【577705282484866†L298-L329】.
 *
 * @param params Objeto de consulta (`workflowId`, `status`, `limit`, `offset`).
 */
export const getExecutions = async (
  params?: Record<string, string | number>
): Promise<{ data: any[]; pagination: { total: number; limit: number; offset: number } }> => {
  const response = await api.get('/automations/executions', { params });
  return extractData(response);
};

/**
 * Recupera os logs de execução de um workflow específico【577705282484866†L338-L366】.
 *
 * @param executionId ID da execução.
 */
export const getExecutionLogs = async (executionId: string): Promise<any> => {
  const response = await api.get(`/automations/executions/${executionId}/logs`);
  return extractData(response);
};

/**
 * Obtém sugestões de automações geradas por IA com base na atividade da empresa【577705282484866†L372-L424】.
 */
export const getSuggestions = async (): Promise<any> => {
  const response = await api.get('/automations/suggestions');
  return extractData(response);
};

/**
 * Analisa um workflow específico e retorna métricas e recomendações de otimização【577705282484866†L444-L516】.
 *
 * @param id ID do workflow a ser analisado.
 */
export const analyzeWorkflow = async (id: string): Promise<any> => {
  const response = await api.get(`/automations/workflows/${id}/analyze`);
  return extractData(response);
};