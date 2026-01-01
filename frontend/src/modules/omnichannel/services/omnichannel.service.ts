/**
 * Omnichannel Service  
 * TODO: Implementar serviço de atendimento omnichannel
 */

import api, { extractData } from '../../../core/utils/api';
import { Conversation, Message, Channel } from '../types';
import { PaginatedResult, PaginationParams } from '../../../core/types';

/**
 * TODO: Implementar listagem de conversas
 * - Filtrar por status, canal, agente
 * - Ordenar por última mensagem
 * - Incluir prévia da última mensagem
 */
export const getConversations = async (
  params?: PaginationParams & { status?: string; channel?: string }
): Promise<PaginatedResult<Conversation>> => {
  const response = await api.get('/omnichannel/conversations', { params });
  return extractData(response);
};

/**
 * TODO: Implementar envio de mensagem
 * - Suportar diferentes tipos de mídia
 * - Enviar via canal apropriado (WhatsApp, Email, etc)
 * - Atualizar lastMessageAt da conversa
 */
export const sendMessage = async (conversationId: string, content: string, type?: string): Promise<Message> => {
  const response = await api.post('/omnichannel/messages', { conversationId, content, type });
  return extractData(response);
};

/**
 * TODO: Implementar atribuição de conversa
 * - Atribuir a agente específico
 * - Notificar agente
 * - Atualizar status
 */
export const assignConversation = async (conversationId: string, agentId: string): Promise<Conversation> => {
  const response = await api.post(`/omnichannel/conversations/${conversationId}/assign`, { agentId });
  return extractData(response);
};

/**
 * TODO: Implementar resolução de conversa
 * - Mudar status para resolved
 * - Registrar tempo de resolução
 * - Enviar pesquisa de satisfação
 */
export const resolveConversation = async (conversationId: string): Promise<Conversation> => {
  const response = await api.post(`/omnichannel/conversations/${conversationId}/resolve`);
  return extractData(response);
};

/**
 * TODO: Implementar gestão de canais
 * - Configurar credenciais de API
 * - Ativar/desativar canais
 * - Testar conexão
 */
export const getChannels = async (): Promise<Channel[]> => {
  const response = await api.get('/omnichannel/channels');
  return extractData(response);
};

export const updateChannel = async (id: string, config: Record<string, unknown>): Promise<Channel> => {
  const response = await api.put(`/omnichannel/channels/${id}`, config);
  return extractData(response);
};
