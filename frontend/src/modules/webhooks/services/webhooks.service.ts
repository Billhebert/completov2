/**
 * Webhooks Service
 * TODO: Implementar serviço de gestão de webhooks
 */

import api, { extractData } from '../../../core/utils/api';
import { Webhook, WebhookLog, CreateWebhookRequest, UpdateWebhookRequest } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * TODO: Implementar listagem de webhooks
 * - Filtrar por ativo/inativo
 * - Incluir estatísticas de sucesso/falha
 */
export const getWebhooks = async (params?: PaginationParams): Promise<PaginatedResult<Webhook>> => {
  const response = await api.get('/webhooks', { params });
  return extractData(response);
};

/**
 * TODO: Implementar criação de webhook
 * - Validar URL
 * - Validar eventos disponíveis
 * - Gerar secret automaticamente se não fornecido
 */
export const createWebhook = async (data: CreateWebhookRequest): Promise<Webhook> => {
  const response = await api.post('/webhooks', data);
  return extractData(response);
};

/**
 * TODO: Implementar atualização de webhook
 * - Validar mudanças
 * - Resetar contadores se mudar URL
 */
export const updateWebhook = async (id: string, data: UpdateWebhookRequest): Promise<Webhook> => {
  const response = await api.put(`/webhooks/${id}`, data);
  return extractData(response);
};

/**
 * TODO: Implementar exclusão de webhook
 * - Remover logs associados (ou manter histórico?)
 */
export const deleteWebhook = async (id: string): Promise<void> => {
  await api.delete(`/webhooks/${id}`);
};

/**
 * TODO: Implementar teste de webhook
 * - Enviar payload de teste
 * - Retornar resposta recebida
 * - Não contar como tentativa real
 */
export const testWebhook = async (id: string): Promise<{ success: boolean; response: unknown }> => {
  const response = await api.post(`/webhooks/${id}/test`);
  return extractData(response);
};

/**
 * TODO: Implementar busca de logs do webhook
 * - Filtrar por sucesso/falha
 * - Mostrar payload e resposta
 * - Permitir retry manual
 */
export const getWebhookLogs = async (
  webhookId: string,
  params?: PaginationParams
): Promise<PaginatedResult<WebhookLog>> => {
  const response = await api.get(`/webhooks/${webhookId}/logs`, { params });
  return extractData(response);
};

/**
 * TODO: Implementar retry manual de webhook
 * - Reenviar payload do log
 * - Incrementar contador de tentativas
 */
export const retryWebhook = async (logId: string): Promise<WebhookLog> => {
  const response = await api.post(`/webhooks/logs/${logId}/retry`);
  return extractData(response);
};

/**
 * TODO: Implementar listagem de eventos disponíveis
 * - Retornar todos os eventos que podem ser subscritos
 * - Agrupar por módulo
 */
export const getAvailableEvents = async (): Promise<Array<{ event: string; description: string; module: string }>> => {
  const response = await api.get('/webhooks/events');
  return extractData(response);
};
