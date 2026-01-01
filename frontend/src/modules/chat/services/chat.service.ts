/**
 * Chat Service
 * TODO: Implementar serviço de chat em tempo real
 */

import api, { extractData } from '../../../core/utils/api';
import { ChatRoom, ChatMessage, CreateRoomRequest, SendMessageRequest } from '../types';

/**
 * TODO: Implementar listagem de salas de chat
 * - Ordenar por última mensagem
 * - Incluir contagem de não lidas
 * - Suportar filtro por tipo (direct/group/channel)
 */
export const getChatRooms = async (): Promise<ChatRoom[]> => {
  const response = await api.get('/chat/rooms');
  return extractData(response);
};

/**
 * TODO: Implementar criação de nova sala
 * - Validar participantes
 * - Para direct, verificar se já existe sala entre os usuários
 * - Enviar notificação aos participantes
 */
export const createRoom = async (data: CreateRoomRequest): Promise<ChatRoom> => {
  const response = await api.post('/chat/rooms', data);
  return extractData(response);
};

/**
 * TODO: Implementar busca de mensagens de uma sala
 * - Paginar (carregar mais antigas sob demanda)
 * - Marcar como lidas ao carregar
 * - Suportar busca por conteúdo
 */
export const getRoomMessages = async (
  roomId: string,
  params?: { before?: string; limit?: number }
): Promise<ChatMessage[]> => {
  const response = await api.get(`/chat/rooms/${roomId}/messages`, { params });
  return extractData(response);
};

/**
 * TODO: Implementar envio de mensagem
 * - Suportar texto, imagens e arquivos
 * - Emitir evento WebSocket para tempo real
 * - Incrementar contagem de não lidas para outros participantes
 */
export const sendMessage = async (data: SendMessageRequest): Promise<ChatMessage> => {
  const response = await api.post('/chat/messages', data);
  return extractData(response);
};

/**
 * TODO: Implementar edição de mensagem
 * - Apenas autor pode editar
 * - Marcar como editada
 * - Limite de tempo para edição (ex: 15 min)
 */
export const editMessage = async (id: string, content: string): Promise<ChatMessage> => {
  const response = await api.put(`/chat/messages/${id}`, { content });
  return extractData(response);
};

/**
 * TODO: Implementar exclusão de mensagem
 * - Apenas autor pode deletar
 * - Marcar como deletada (não remover do DB)
 * - Substituir conteúdo por "Mensagem deletada"
 */
export const deleteMessage = async (id: string): Promise<void> => {
  await api.delete(`/chat/messages/${id}`);
};

/**
 * TODO: Implementar marcação de mensagens como lidas
 * - Atualizar contador de não lidas
 * - Emitir evento WebSocket (indicador de "visto")
 */
export const markAsRead = async (roomId: string): Promise<void> => {
  await api.post(`/chat/rooms/${roomId}/mark-read`);
};

/**
 * TODO: Implementar upload de arquivo para chat
 * - Validar tipo e tamanho
 * - Fazer upload para storage
 * - Retornar URL para enviar na mensagem
 */
export const uploadFile = async (file: File): Promise<{ url: string; fileName: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return extractData(response);
};
