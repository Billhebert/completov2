// web/src/pages/WebhooksPage.tsx
import { useEffect, useState } from 'react';
import { Plus, Webhook, Activity, Settings, Play, Trash2, Edit } from 'lucide-react';
import { useWebhooksStore } from '../store/webhooksStore';
import type { WebhookEndpoint, CreateWebhookEndpoint } from '../types/webhooks';
import toast from 'react-hot-toast';

export default function WebhooksPage() {
  const {
    endpoints,
    deliveries,
    events,
    isLoading,
    fetchEndpoints,
    fetchEvents,
    fetchDeliveries,
    createEndpoint,
    updateEndpoint,
    deleteEndpoint,
    toggleEndpoint,
    testEndpoint,
  } = useWebhooksStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'endpoints' | 'events' | 'deliveries'>('endpoints');

  useEffect(() => {
    fetchEndpoints();
    fetchEvents();
  }, []);

  const handleCreateEndpoint = async (data: CreateWebhookEndpoint) => {
    try {
      await createEndpoint(data);
      toast.success('Webhook endpoint created successfully');
      setShowCreateModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create endpoint');
    }
  };

  const handleToggleEndpoint = async (id: string, isActive: boolean) => {
    try {
      await toggleEndpoint(id, !isActive);
      toast.success(`Endpoint ${!isActive ? 'activated' : 'deactivated'}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to toggle endpoint');
    }
  };

  const handleTestEndpoint = async (id: string) => {
    try {
      await testEndpoint(id);
      toast.success('Test webhook sent successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to send test webhook');
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    if (!confirm('Are you sure you want to delete this endpoint?')) return;
    try {
      await deleteEndpoint(id);
      toast.success('Endpoint deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete endpoint');
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Webhooks & Events</h1>
          <p className="text-muted-foreground mt-2">
            Configure webhooks to receive real-time event notifications
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Endpoint
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {['endpoints', 'events', 'deliveries'].map((tab) => (
            <button
              key={tab}
              onClick={() => setSelectedTab(tab as any)}
              className={`pb-4 px-2 border-b-2 transition-colors capitalize ${
                selectedTab === tab
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Endpoints Tab */}
      {selectedTab === 'endpoints' && (
        <div className="grid grid-cols-1 gap-4">
          {endpoints.map((endpoint) => (
            <div
              key={endpoint.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Webhook className="h-5 w-5 text-primary" />
                    <h3 className="text-lg font-semibold text-foreground">{endpoint.name}</h3>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        endpoint.isActive
                          ? 'bg-green-500/10 text-green-600'
                          : 'bg-gray-500/10 text-gray-600'
                      }`}
                    >
                      {endpoint.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{endpoint.url}</p>
                  {endpoint.description && (
                    <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-2">
                    {endpoint.events.map((event) => (
                      <span
                        key={event}
                        className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full"
                      >
                        {event}
                      </span>
                    ))}
                  </div>

                  {endpoint._count && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      <Activity className="inline h-4 w-4 mr-1" />
                      {endpoint._count.deliveries} deliveries
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTestEndpoint(endpoint.id)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    title="Test endpoint"
                  >
                    <Play className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleToggleEndpoint(endpoint.id, endpoint.isActive)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    title={endpoint.isActive ? 'Deactivate' : 'Activate'}
                  >
                    <Settings className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteEndpoint(endpoint.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {endpoints.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-lg">
              <Webhook className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No webhook endpoints</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first webhook endpoint.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Events Tab */}
      {selectedTab === 'events' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">{event.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{event.category}</p>
                  {event.description && (
                    <p className="text-sm text-muted-foreground mt-2">{event.description}</p>
                  )}
                  <span
                    className={`inline-block mt-3 px-2 py-1 text-xs font-medium rounded-full ${
                      event.isSystem
                        ? 'bg-blue-500/10 text-blue-600'
                        : 'bg-purple-500/10 text-purple-600'
                    }`}
                  >
                    {event.isSystem ? 'System' : 'Custom'}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="col-span-full text-center py-12 bg-card border border-border rounded-lg">
              <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No events defined</h3>
              <p className="mt-1 text-sm text-muted-foreground">Events will appear here.</p>
            </div>
          )}
        </div>
      )}

      {/* Deliveries Tab */}
      {selectedTab === 'deliveries' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Endpoint
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Attempts
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {deliveries.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-2 text-sm font-medium text-foreground">No deliveries yet</h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Webhook deliveries will appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                deliveries.map((delivery) => (
                  <tr key={delivery.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {delivery.eventName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {delivery.endpoint?.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          delivery.success
                            ? 'bg-green-500/10 text-green-600'
                            : 'bg-red-500/10 text-red-600'
                        }`}
                      >
                        {delivery.success ? 'Success' : 'Failed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {delivery.attemptNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {new Date(delivery.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Endpoint Modal */}
      {showCreateModal && (
        <CreateEndpointModal
          events={events.map((e) => e.name)}
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateEndpoint}
        />
      )}
    </div>
  );
}

// Create Endpoint Modal Component
function CreateEndpointModal({
  events,
  onClose,
  onCreate,
}: {
  events: string[];
  onClose: () => void;
  onCreate: (data: CreateWebhookEndpoint) => void;
}) {
  const [formData, setFormData] = useState<CreateWebhookEndpoint>({
    name: '',
    url: '',
    events: [],
    timeout: 30000,
    retryConfig: {
      maxRetries: 3,
      backoff: 'exponential',
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">Create Webhook Endpoint</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Webhook URL</label>
            <input
              type="url"
              required
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="https://example.com/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Events (select at least one)
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-border rounded-lg p-3">
              {events.map((event) => (
                <label key={event} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.events.includes(event)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData({ ...formData, events: [...formData.events, event] });
                      } else {
                        setFormData({
                          ...formData,
                          events: formData.events.filter((ev) => ev !== event),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-foreground">{event}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              rows={3}
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
