import { useQuery } from '@tanstack/react-query';
import { MessageSquare, Phone, Mail } from 'lucide-react';
import api from '../services/api';
import type { Conversation } from '../types';

export default function ConversationsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.getConversations({ page: 1, pageSize: 20 }),
  });

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-5 w-5" />;
      case 'sms':
        return <Phone className="h-5 w-5" />;
      case 'email':
        return <Mail className="h-5 w-5" />;
      default:
        return <MessageSquare className="h-5 w-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-green-500/10 text-green-500';
      case 'pending':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'closed':
        return 'bg-gray-500/10 text-gray-500';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Conversations</h1>
          <p className="text-muted-foreground mt-2">Manage all customer conversations in one place</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          New Conversation
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((conversation: Conversation) => (
                <tr key={conversation.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getChannelIcon(conversation.channel)}
                      <span className="ml-2 text-sm text-foreground capitalize">
                        {conversation.channel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      {conversation.contact?.name || 'Unknown'}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {conversation.contact?.email || conversation.contact?.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(conversation.status)}`}>
                      {conversation.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {new Date(conversation.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button className="text-primary hover:text-primary/80">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {!data?.data.length && (
          <div className="text-center py-12">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No conversations</h3>
            <p className="mt-1 text-sm text-muted-foreground">Get started by creating a new conversation.</p>
          </div>
        )}
      </div>
    </div>
  );
}
