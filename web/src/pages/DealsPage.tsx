import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Briefcase, TrendingUp } from 'lucide-react';
import api from '../services/api';
import type { Deal, Contact } from '../types';
import toast from 'react-hot-toast';

export default function DealsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.getDeals({ page: 1, pageSize: 20 }),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => api.getContacts({ page: 1, pageSize: 100 }),
  });

  const createMutation = useMutation({
    mutationFn: (newDeal: Partial<Deal>) => api.createDeal(newDeal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
    },
  });

  const handleCreateDeal = async (dealData: Partial<Deal>) => {
    try {
      await createMutation.mutateAsync(dealData);
      toast.success('Deal created successfully');
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create deal');
    }
  };

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'PROSPECTING':
        return 'bg-gray-500/10 text-gray-500';
      case 'QUALIFICATION':
        return 'bg-blue-500/10 text-blue-500';
      case 'PROPOSAL':
        return 'bg-purple-500/10 text-purple-500';
      case 'NEGOTIATION':
        return 'bg-yellow-500/10 text-yellow-500';
      case 'CLOSED_WON':
        return 'bg-green-500/10 text-green-500';
      case 'CLOSED_LOST':
        return 'bg-red-500/10 text-red-500';
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

  const totalValue = data?.data.reduce((sum: number, deal: Deal) => sum + (deal.value || 0), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Deals</h1>
          <p className="text-muted-foreground mt-2">Track your sales pipeline</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          New Deal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Pipeline Value</p>
              <p className="text-3xl font-bold text-foreground mt-2">${totalValue.toLocaleString()}</p>
            </div>
            <div className="p-3 rounded-lg bg-green-500/10">
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Deals</p>
              <p className="text-3xl font-bold text-foreground mt-2">{data?.data.length || 0}</p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/10">
              <Briefcase className="h-6 w-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Stage
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Expected Close
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data?.data.map((deal: Deal) => (
                <tr key={deal.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-foreground">{deal.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground">
                      {deal.contact?.name || 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-foreground">
                      ${(deal.value || 0).toLocaleString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStageColor(deal.stage)}`}>
                      {deal.stage.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {deal.expectedCloseDate
                      ? new Date(deal.expectedCloseDate).toLocaleDateString()
                      : 'Not set'}
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
            <Briefcase className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">No deals</h3>
            <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first deal.</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateDealModal
          contacts={contactsData?.data || []}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateDeal}
        />
      )}
    </div>
  );
}

// Create Deal Modal Component
function CreateDealModal({
  contacts,
  onClose,
  onCreate,
}: {
  contacts: Contact[];
  onClose: () => void;
  onCreate: (data: Partial<Deal>) => void;
}) {
  const [formData, setFormData] = useState<Partial<Deal>>({
    title: '',
    contactId: '',
    value: 0,
    stage: 'PROSPECTING',
    expectedCloseDate: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title?.trim()) {
      toast.error('Deal title is required');
      return;
    }
    if (!formData.contactId) {
      toast.error('Please select a contact');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">Create Deal</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Deal Title
            </label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="Enterprise Contract"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Contact
            </label>
            <select
              required
              value={formData.contactId || ''}
              onChange={(e) => setFormData({ ...formData, contactId: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">-- Select Contact --</option>
              {contacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Deal Value ($)
            </label>
            <input
              type="number"
              min="0"
              step="1000"
              value={formData.value || 0}
              onChange={(e) =>
                setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="50000"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Stage
            </label>
            <select
              value={formData.stage || 'PROSPECTING'}
              onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="PROSPECTING">Prospecting</option>
              <option value="QUALIFICATION">Qualification</option>
              <option value="PROPOSAL">Proposal</option>
              <option value="NEGOTIATION">Negotiation</option>
              <option value="CLOSED_WON">Closed Won</option>
              <option value="CLOSED_LOST">Closed Lost</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Expected Close Date (Optional)
            </label>
            <input
              type="date"
              value={formData.expectedCloseDate || ''}
              onChange={(e) =>
                setFormData({ ...formData, expectedCloseDate: e.target.value })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
