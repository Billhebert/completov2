/**
 * Sync Service
 *
 * Este serviço oferece funções para gerenciar conexões de integrações e iniciar
 * processos de sincronização. O backend permite listar e criar conexões, enfileirar
 * sincronizações assíncronas, consultar execuções e realizar sincronizações
 * manuais imediatas【643399667495487†L25-L79】【643399667495487†L124-L181】.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Lista as conexões de integração cadastradas para a empresa do usuário【643399667495487†L25-L37】.
 */
export const listConnections = async (): Promise<any[]> => {
  const response = await api.get('/sync/connections');
  return extractData(response);
};

/**
 * Cria uma nova conexão de integração.
 *
 * @param data Objeto contendo `provider` (ex.: 'rdstation', 'chatwoot'), `apiKey` e opcional `config`【643399667495487†L44-L54】.
 */
export const createConnection = async (data: {
  provider: 'rdstation' | 'confirm8' | 'pipefy' | 'chatwoot' | string;
  apiKey: string;
  config?: Record<string, any>;
}): Promise<any> => {
  const response = await api.post('/sync/connections', data);
  return extractData(response);
};

/**
 * Enfileira um job de sincronização para um provedor e tipo de entidade【643399667495487†L62-L79】.
 *
 * O backend processa a sincronização em segundo plano; o resultado pode ser consultado em `/sync/runs`.
 *
 * @param data Objeto contendo `provider`, `entityType` (ex.: 'contacts') e `direction` ('pull' ou 'push').
 */
export const triggerSync = async (data: {
  provider: string;
  entityType: string;
  direction: 'pull' | 'push';
}): Promise<{ jobId: string; message: string }> => {
  const response = await api.post('/sync/run', data);
  return extractData(response);
};

/**
 * Lista as execuções de sincronização, ordenadas por data de início【643399667495487†L85-L92】.
 */
export const listRuns = async (): Promise<any[]> => {
  const response = await api.get('/sync/runs');
  return extractData(response);
};

/**
 * Recupera detalhes de uma execução de sincronização específica, incluindo logs【643399667495487†L99-L118】.
 *
 * @param runId ID da execução de sincronização.
 */
export const getRun = async (runId: string): Promise<any> => {
  const response = await api.get(`/sync/runs/${runId}`);
  return extractData(response);
};

/**
 * Executa a sincronização manualmente em uma conexão específica, sem enfileirar job【643399667495487†L124-L177】.
 *
 * O backend cria um conector para o provedor e retorna contagem de registros criados, atualizados, ignorados
 * e erros. Também atualiza a data de última sincronização da conexão.
 *
 * @param connectionId ID da conexão de integração.
 */
export const manualSync = async (connectionId: string): Promise<any> => {
  const response = await api.post(`/sync/connections/${connectionId}/sync`);
  return extractData(response);
};
