/**
 * Omnichannel Types
 * Tipos para atendimento omnichannel
 */

export interface Conversation {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail?: string;
  channel: 'email' | 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'webchat';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  assignedTo?: string;
  assignedToName?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderType: 'customer' | 'agent' | 'system';
  content: string;
  type: 'text' | 'image' | 'file' | 'audio' | 'video';
  metadata?: Record<string, unknown>;
  sentAt: string;
}

export interface Channel {
  id: string;
  name: string;
  type: 'email' | 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'webchat';
  isActive: boolean;
  config: Record<string, unknown>;
  messagesCount: number;
}
