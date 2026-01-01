/**
 * Chat Types  
 * Tipos para sistema de chat/mensagens
 */

export interface ChatRoom {
  id: string;
  name: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[];
  participantDetails?: Array<{ id: string; name: string; avatar?: string }>;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'system';
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  isEdited: boolean;
  isDeleted: boolean;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoomRequest {
  name?: string;
  type: 'direct' | 'group' | 'channel';
  participants: string[];
}

export interface SendMessageRequest {
  roomId: string;
  content: string;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}
