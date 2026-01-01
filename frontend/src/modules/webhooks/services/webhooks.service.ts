/**
 * Webhooks Service
 *
 * Este serviço encapsula as chamadas ao módulo de Webhooks do backend. O
 * backend permite que empresas definam eventos personalizados, cadastrem
 * endpoints para receber notificações desses eventos e consultem os logs de
 * entrega. As rotas expostas incluem criação e listagem de definições de
 * eventos, criação, atualização e remoção de endpoints, consulta a logs de
 * entrega filtrados, e um endpoint de teste para enviar um evento de
 * demonstração【913635998450837†L15-L45】【913635998450837†L125-L175】.
 */

import api, { extractData } from '../../../core/utils/api';

// ===== Event Definitions =====

/**
 * Lista todas as definições de eventos ativas da empresa【913635998450837†L17-L23】.
 */
export const getEventDefinitions = async (): Promise<any[]> => {
  const response = await api.get('/webhooks/events');
  return extractData(response);
};

/**
 * Cria uma nova definição de evento personalizada. Apenas usuários admins da
 * empresa podem registrar novos eventos【913635998450837†L29-L45】.
 *
 * @param name       Nome interno do evento (ex.: 'invoice.created').
 * @param category   Categoria para organização (ex.: 'financeiro').
 * @param description Descrição amigável para usuários.
 * @param schema     JSON Schema opcional para validar payloads enviados.
 */
export const createEventDefinition = async (params: {
  name: string;
  category?: string;
  description?: string;
  schema?: any;
}): Promise<any> => {
  const response = await api.post('/webhooks/events', params);
  return extractData(response);
};

// ===== Webhook Endpoints =====

/**
 * Lista todos os endpoints configurados para a empresa. Inclui contadores de
 * entregas e status de ativação【913635998450837†L52-L68】.
 */
export const getEndpoints = async (): Promise<any[]> => {
  const response = await api.get('/webhooks/endpoints');
  return extractData(response);
};

/**
 * Cria um novo endpoint de webhook. É gerada automaticamente uma chave secreta
 * usada para assinar os payloads【913635998450837†L73-L92】.
 *
 * @param data Objeto contendo name, url, events, headers, timeout, retryConfig e description.
 */
export const createEndpoint = async (data: {
  name: string;
  url: string;
  events?: string[];
  headers?: Record<string, string> | null;
  timeout?: number;
  retryConfig?: { maxRetries?: number; backoff?: string };
  description?: string;
}): Promise<any> => {
  const response = await api.post('/webhooks/endpoints', data);
  return extractData(response);
};

/**
 * Atualiza um endpoint existente. Permite alterar nome, URL, eventos, headers,
 * timeouts, política de retentativas e ativação【913635998450837†L98-L109】.
 *
 * @param id   ID do endpoint a ser atualizado.
 * @param data Objeto com os campos a serem atualizados.
 */
export const updateEndpoint = async (
  id: string,
  data: Partial<{
    name: string;
    url: string;
    events: string[];
    headers: Record<string, string> | null;
    timeout: number;
    retryConfig: { maxRetries?: number; backoff?: string };
    isActive: boolean;
    description: string;
  }>
): Promise<any> => {
  const response = await api.put(`/webhooks/endpoints/${id}`, data);
  return extractData(response);
};

/**
 * Remove permanentemente um endpoint de webhook【913635998450837†L114-L120】.
 *
 * @param id ID do endpoint.
 */
export const deleteEndpoint = async (id: string): Promise<void> => {
  await api.delete(`/webhooks/endpoints/${id}`);
};

// ===== Delivery Logs =====

/**
 * Lista logs de entrega de webhooks com filtros opcionais de endpoint, evento e
 * sucesso. Limite de registros retornados pode ser ajustado【913635998450837†L127-L147】.
 *
 * @param params Filtros de consulta: endpointId, eventName, success (booleano como string) e limit.
 */
export const getDeliveryLogs = async (
  params?: { endpointId?: string; eventName?: string; success?: boolean; limit?: number }
): Promise<any[]> => {
  const queryParams: Record<string, any> = {};
  if (params) {
    if (params.endpointId) queryParams.endpointId = params.endpointId;
    if (params.eventName) queryParams.eventName = params.eventName;
    if (params.success !== undefined) queryParams.success = params.success;
    if (params.limit !== undefined) queryParams.limit = params.limit;
  }
  const response = await api.get('/webhooks/deliveries', { params: queryParams });
  return extractData(response);
};

// ===== Test Endpoint =====

/**
 * Dispara um evento de teste para o endpoint especificado. O backend retorna
 * mensagem de sucesso se o evento de teste for despachado【913635998450837†L154-L170】.
 *
 * @param id ID do endpoint a ser testado.
 */
export const testWebhookEndpoint = async (id: string): Promise<any> => {
  const response = await api.post(`/webhooks/test/${id}`);
  return extractData(response);
};