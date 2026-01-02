/**
 * Chat List Page
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AppLayout } from '../../shared';
import * as chatService from '../services/chat.service';
import type { ChatRoom } from '../types/chat.types';
import {
  ChatBubbleLeftRightIcon,
  PlusIcon,
  UserGroupIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

export default function ChatListPage() {
  const [chatRooms, setChatRooms] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadChatRooms();
  }, []);

  const loadChatRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const rooms = await chatService.getChatRooms({
        includeUnread: true,
        sortBy: 'lastMessage',
      });
      setChatRooms(rooms);
    } catch (err: any) {
      console.error('Failed to load chat rooms:', err);
      setError(err.message || 'Erro ao carregar conversas');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Chat</h1>
            <p className="text-lg text-gray-600">Conversas e mensagens em tempo real</p>
          </div>
          <button
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-sm"
          >
            <PlusIcon className="h-5 w-5" />
            Nova Conversa
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total de Conversas</span>
              <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{chatRooms.length}</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Grupos Ativos</span>
              <UserGroupIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {chatRooms.filter((r) => r.type === 'group' || r.type === 'channel').length}
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Mensagens Diretas</span>
              <ClockIcon className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold text-gray-900">
              {chatRooms.filter((r) => r.type === 'direct').length}
            </p>
          </div>
        </div>

        {/* Chat Rooms List */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Carregando conversas...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-12 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={loadChatRooms}
              className="px-6 py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              Tentar Novamente
            </button>
          </div>
        ) : chatRooms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <ChatBubbleLeftRightIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma conversa ainda</h3>
            <p className="text-gray-600 mb-6">Comece uma nova conversa para colaborar com sua equipe</p>
            <button className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors">
              <PlusIcon className="h-5 w-5" />
              Iniciar Conversa
            </button>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-200">
            {chatRooms.map((room) => (
              <div
                key={room.id}
                className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {room.name || 'Conversa Direta'}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {room.type === 'direct' ? 'Direto' : room.type === 'group' ? 'Grupo' : 'Canal'}
                      </span>
                    </div>
                    {room.description && (
                      <p className="text-gray-600 text-sm mb-2">{room.description}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Criado em {new Date(room.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  {room.unreadCount !== undefined && room.unreadCount > 0 && (
                    <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                      {room.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
