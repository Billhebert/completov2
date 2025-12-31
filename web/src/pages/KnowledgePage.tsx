import { useQuery } from '@tanstack/react-query';
import { BookOpen, Tag } from 'lucide-react';
import api from '../services/api';
import type { Zettel } from '../types';

export default function KnowledgePage() {
  const { data, isLoading } = useQuery({
    queryKey: ['zettels'],
    queryFn: () => api.getZettels({ page: 1, pageSize: 20 }),
  });

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'FLEETING':
        return 'bg-gray-500/10 text-gray-500';
      case 'LITERATURE':
        return 'bg-blue-500/10 text-blue-500';
      case 'PERMANENT':
        return 'bg-purple-500/10 text-purple-500';
      case 'HUB':
        return 'bg-orange-500/10 text-orange-500';
      case 'CLIENT':
        return 'bg-green-500/10 text-green-500';
      case 'NEGOTIATION':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'TASK':
        return 'bg-red-500/10 text-red-500';
      case 'LEARNING':
        return 'bg-cyan-500/10 text-cyan-500';
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
          <h1 className="text-3xl font-bold text-foreground">Knowledge Base</h1>
          <p className="text-muted-foreground mt-2">Your Zettelkasten knowledge management system</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          New Zettel
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data.map((zettel: Zettel) => (
          <div
            key={zettel.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(zettel.type)}`}>
                {zettel.type}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
              {zettel.title}
            </h3>

            <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
              {zettel.content}
            </p>

            {zettel.tags && zettel.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {zettel.tags.slice(0, 3).map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 text-xs bg-muted text-muted-foreground rounded"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </span>
                ))}
                {zettel.tags.length > 3 && (
                  <span className="text-xs text-muted-foreground">+{zettel.tags.length - 3} more</span>
                )}
              </div>
            )}

            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{new Date(zettel.createdAt).toLocaleDateString()}</span>
                {zettel.links && zettel.links.length > 0 && (
                  <span>{zettel.links.length} link{zettel.links.length !== 1 ? 's' : ''}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {!data?.data.length && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No zettels yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Start building your knowledge base by creating your first zettel.</p>
        </div>
      )}
    </div>
  );
}
