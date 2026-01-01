/**
 * Notifications Service
 *
 * Este serviço encapsula as chamadas à API de notificações implementada no backend. O
 * backend oferece uma série de funcionalidades para entrega, leitura, resumo e
 * preferências de notificações, incluindo suporte a SMS, push web, batch e
 * análise de métricas【596393780336477†L124-L133】【353987513077810†L43-L74】.
 */

import api, { extractData } from '../../../core/utils/api';

/**
 * Lista notificações do usuário atual. O backend permite ordenar por prioridade AI
 * passando `sortByPriority=true`【596393780336477†L124-L129】.
 *
 * @param sortByPriority Se verdadeiro, ordena por pontuação de prioridade (alta → baixa) antes da data.
 */
export const getNotifications = async (sortByPriority = false): Promise<any[]> => {
  const response = await api.get('/notifications', { params: { sortByPriority } });
  return extractData(response);
};

/**
 * Recupera um resumo inteligente de notificações pendentes gerado por IA【596393780336477†L134-L196】.
 *
 * @returns Objeto com `summary`, `totalUnread`, `highPriority`, `categories` e `topNotifications`.
 */
export const getSummary = async (): Promise<any> => {
  const response = await api.get('/notifications/summary');
  return extractData(response);
};

/**
 * Marca uma notificação individual como lida【596393780336477†L246-L249】.
 *
 * @param id ID da notificação.
 */
export const markAsRead = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`);
};

/**
 * Marca todas as notificações do usuário como lidas【596393780336477†L255-L259】.
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.post('/notifications/read-all');
};

/**
 * Envia um SMS via Twilio. Requer permissões adequadas (USER_CREATE) no backend【353987513077810†L43-L74】.
 *
 * @param to Número de telefone de destino (incluindo código do país).
 * @param message Conteúdo do SMS.
 * @param userId ID do usuário associado (opcional).
 */
export const sendSMS = async (to: string, message: string, userId?: string): Promise<any> => {
  const response = await api.post('/notifications/sms', { to, message, userId });
  return extractData(response);
};

/**
 * Obtém o status de entrega de um SMS enviado【353987513077810†L80-L113】.
 *
 * @param id ID da notificação de SMS.
 */
export const getSMSStatus = async (id: string): Promise<{ status: string }> => {
  const response = await api.get(`/notifications/sms/${id}/status`);
  return extractData(response);
};

/**
 * Envia uma notificação push para um usuário específico【353987513077810†L117-L152】.
 *
 * @param userId ID do usuário que receberá a notificação.
 * @param title Título da notificação.
 * @param body Corpo da notificação.
 * @param icon Ícone opcional.
 * @param url URL opcional para abrir ao clicar.
 */
export const sendWebPush = async (
  userId: string,
  title: string,
  body: string,
  icon?: string,
  url?: string
): Promise<any> => {
  const response = await api.post('/notifications/web-push', { userId, title, body, icon, url });
  return extractData(response);
};

/**
 * Registra um dispositivo/endpoint para receber push notifications【353987513077810†L159-L177】.
 *
 * @param endpoint Endpoint de assinatura Web Push.
 * @param keys Chaves públicas (p256dh) e de autenticação (auth) da assinatura.
 */
export const registerPushSubscription = async (
  endpoint: string,
  keys: { p256dh: string; auth: string }
): Promise<any> => {
  const response = await api.post('/notifications/push-subscription', { endpoint, keys });
  return extractData(response);
};

/**
 * Remove uma assinatura de push para o endpoint fornecido【353987513077810†L188-L202】.
 *
 * @param endpoint Endpoint de assinatura a ser removido.
 */
export const unregisterPushSubscription = async (endpoint: string): Promise<void> => {
  await api.delete(`/notifications/push-subscription/${encodeURIComponent(endpoint)}`);
};

/**
 * Recupera as preferências de notificação do usuário【353987513077810†L210-L238】.
 */
export const getPreferences = async (): Promise<any> => {
  const response = await api.get('/notifications/preferences');
  return extractData(response);
};

/**
 * Atualiza ou cria as preferências de notificação do usuário【353987513077810†L244-L276】.
 *
 * @param prefs Objeto com preferências parciais, seguindo o schema do backend.
 */
export const updatePreferences = async (prefs: any): Promise<any> => {
  const response = await api.patch('/notifications/preferences', prefs);
  return extractData(response);
};

/**
 * Envia notificações em lote para múltiplos usuários【353987513077810†L281-L331】.
 *
 * @param userIds Array de IDs de usuários.
 * @param type Tipo de notificação.
 * @param title Título da notificação.
 * @param content Conteúdo (corpo) da notificação.
 * @param data Dados adicionais opcionais.
 */
export const sendBatchNotifications = async (
  userIds: string[],
  type: string,
  title: string,
  content: string,
  data?: Record<string, any>
): Promise<{ sent: number; notifications: any[] }> => {
  const response = await api.post('/notifications/batch', { userIds, type, title, content, data });
  return extractData(response);
};

/**
 * Adia (snooze) uma notificação até uma determinada data/hora【353987513077810†L340-L357】.
 *
 * @param id ID da notificação.
 * @param until Data/hora ISO para reativar a notificação.
 */
export const snoozeNotification = async (id: string, until: string): Promise<any> => {
  const response = await api.post(`/notifications/${id}/snooze`, { until });
  return extractData(response);
};

/**
 * Lista notificações que estão snoozed (adiadas)【353987513077810†L365-L382】.
 */
export const getSnoozedNotifications = async (): Promise<any[]> => {
  const response = await api.get('/notifications/snoozed');
  return extractData(response);
};

/**
 * Obtém estatísticas de notificações para o período especificado【353987513077810†L391-L447】.
 *
 * @param params Parâmetros opcionais `startDate` e `endDate` no formato ISO.
 */
export const getNotificationStats = async (
  params?: Record<string, string>
): Promise<any> => {
  const response = await api.get('/notifications/stats', { params });
  return extractData(response);
};