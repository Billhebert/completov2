/**
 * Notifications Service
 * TODO: Implementar serviço de notificações
 */

import api, { extractData } from '../../../core/utils/api';
import { Notification, NotificationPreferences } from '../types';

/**
 * TODO: Implementar listagem de notificações do usuário
 * - Ordenar por data (mais recentes primeiro)
 * - Marcar automaticamente como visualizadas após X segundos
 */
export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/notifications');
  return extractData(response);
};

/**
 * TODO: Marcar notificação como lida
 */
export const markAsRead = async (id: string): Promise<void> => {
  await api.post(`/notifications/${id}/read`);
};

/**
 * TODO: Marcar todas como lidas
 */
export const markAllAsRead = async (): Promise<void> => {
  await api.post('/notifications/read-all');
};

/**
 * TODO: Buscar preferências de notificações
 */
export const getPreferences = async (): Promise<NotificationPreferences> => {
  const response = await api.get('/notifications/preferences');
  return extractData(response);
};

/**
 * TODO: Atualizar preferências
 */
export const updatePreferences = async (prefs: Partial<NotificationPreferences>): Promise<NotificationPreferences> => {
  const response = await api.put('/notifications/preferences', prefs);
  return extractData(response);
};
