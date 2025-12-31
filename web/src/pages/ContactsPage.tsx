import { useQuery } from '@tanstack/react-query';
import { Users, Star } from 'lucide-react';
import api from '../services/api';
import type { Contact } from '../types';

export default function ContactsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.getContacts({ page: 1, pageSize: 20 }),
  });

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
          <h1 className="text-3xl font-bold text-foreground">Contacts</h1>
          <p className="text-muted-foreground mt-2">Manage your customer relationships</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
          Add Contact
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {data?.data.map((contact: Contact) => (
          <div
            key={contact.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-semibold text-foreground">{contact.name}</h3>
                  {contact.isVIP && (
                    <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {contact.email && (
                    <p className="text-sm text-muted-foreground">{contact.email}</p>
                  )}
                  {contact.phone && (
                    <p className="text-sm text-muted-foreground">{contact.phone}</p>
                  )}
                </div>
              </div>
            </div>

            {contact.tags && contact.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {contact.tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-border flex gap-2">
              <button className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                View
              </button>
              <button className="flex-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-accent transition-colors">
                Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {!data?.data.length && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <Users className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No contacts</h3>
          <p className="mt-1 text-sm text-muted-foreground">Get started by adding your first contact.</p>
        </div>
      )}
    </div>
  );
}
