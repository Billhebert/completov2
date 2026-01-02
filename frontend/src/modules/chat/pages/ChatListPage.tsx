/**
 * Chat List Page
 */

import React, { useState, useEffect } from 'react';
import { AppLayout, Card, Button, DataTable } from '../../shared';
import * as chatService from '../services/chat.service';
import { ChatRoom } from '../types/chat.types';
import { handleApiError } from '../../../core/utils/api';

export const ChatListPage: React.FC = () => {
  // Utiliza ChatRoom em vez do tipo inexistente Chat
  const [data, setData] = useState<ChatRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Pode usar chatService.getChatRooms() ou chatService.getAll()
      const rooms = await chatService.getChatRooms();
      setData(rooms);
    } catch (error) {
      console.error('Error loading data:', handleApiError(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="page-container">
        <div className="page-header">
          <h1 className="text-3xl font-bold text-gray-900">Chat</h1>
          <Button variant="primary">Criar Novo</Button>
        </div>

        <Card noPadding>
          <DataTable
            columns={[
              { key: 'name', label: 'Nome', sortable: true },
              { key: 'type', label: 'Tipo' },
              { key: 'createdAt', label: 'Criado em' },
            ]}
            data={data}
            keyExtractor={(record) => record.id}
            isLoading={isLoading}
          />
        </Card>
      </div>
    </AppLayout>
  );
};

export default ChatListPage;
