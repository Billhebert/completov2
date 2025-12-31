import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Plus, QrCode, Send, Power, Trash2, RefreshCw } from 'lucide-react';
import api from '../services/api';
import type { WhatsAppAccount, CreateWhatsAppAccount } from '../types';
import toast from 'react-hot-toast';

export default function WhatsAppPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<WhatsAppAccount | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showSendMessageModal, setShowSendMessageModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: accounts, isLoading } = useQuery({
    queryKey: ['whatsapp-accounts'],
    queryFn: () => api.getWhatsAppAccounts(),
    refetchInterval: 10000, // Auto-refresh every 10 seconds
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateWhatsAppAccount) => api.createWhatsAppAccount(data),
    onSuccess: (account) => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
      toast.success('WhatsApp account created successfully');
      setShowCreateModal(false);
      // Show QR code modal
      setSelectedAccount(account);
      setShowQRModal(true);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create WhatsApp account');
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (accountId: string) => api.disconnectWhatsAppAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
      toast.success('WhatsApp account disconnected');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to disconnect account');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (accountId: string) => api.deleteWhatsAppAccount(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
      toast.success('WhatsApp account deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });

  const handleCreateAccount = async (data: CreateWhatsAppAccount) => {
    createMutation.mutate(data);
  };

  const handleViewQR = (account: WhatsAppAccount) => {
    setSelectedAccount(account);
    setShowQRModal(true);
  };

  const handleSendMessage = (account: WhatsAppAccount) => {
    setSelectedAccount(account);
    setShowSendMessageModal(true);
  };

  const handleDisconnect = (accountId: string) => {
    if (confirm('Are you sure you want to disconnect this WhatsApp account?')) {
      disconnectMutation.mutate(accountId);
    }
  };

  const handleDelete = (accountId: string) => {
    if (confirm('Are you sure you want to delete this WhatsApp account? This action cannot be undone.')) {
      deleteMutation.mutate(accountId);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      connected: 'bg-green-500/10 text-green-500',
      disconnected: 'bg-gray-500/10 text-gray-500',
      connecting: 'bg-blue-500/10 text-blue-500',
      pairing: 'bg-yellow-500/10 text-yellow-500',
    };
    return badges[status as keyof typeof badges] || badges.disconnected;
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
          <h1 className="text-3xl font-bold text-foreground">WhatsApp Integration</h1>
          <p className="text-muted-foreground mt-2">
            Manage WhatsApp accounts via Evolution API
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add WhatsApp Account
        </button>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts?.map((account) => (
          <div
            key={account.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{account.name}</h3>
                  <p className="text-xs text-muted-foreground">{account.instanceName}</p>
                </div>
              </div>
              <span
                className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(
                  account.status
                )}`}
              >
                {account.status}
              </span>
            </div>

            {/* Phone Number */}
            {account.phoneNumber && (
              <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">Phone Number</p>
                <p className="text-sm font-medium text-foreground">{account.phoneNumber}</p>
              </div>
            )}

            {/* Last Connected */}
            {account.lastConnectedAt && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground">
                  Last connected: {new Date(account.lastConnectedAt).toLocaleString()}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2">
              {/* View QR Code - Show if pairing or disconnected */}
              {(account.status === 'pairing' || account.status === 'disconnected') && (
                <button
                  onClick={() => handleViewQR(account)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <QrCode className="h-4 w-4" />
                  View QR Code
                </button>
              )}

              {/* Send Test Message - Show if connected */}
              {account.status === 'connected' && (
                <button
                  onClick={() => handleSendMessage(account)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <Send className="h-4 w-4" />
                  Send Test Message
                </button>
              )}

              {/* Disconnect - Show if connected */}
              {account.status === 'connected' && (
                <button
                  onClick={() => handleDisconnect(account.id)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-orange-500 text-orange-500 rounded-lg hover:bg-orange-500/10 transition-colors"
                >
                  <Power className="h-4 w-4" />
                  Disconnect
                </button>
              )}

              {/* Delete */}
              <button
                onClick={() => handleDelete(account.id)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!accounts?.length && (
        <div className="text-center py-12 bg-card border border-border rounded-lg">
          <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">No WhatsApp accounts</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by adding your first WhatsApp account.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Add WhatsApp Account
          </button>
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateWhatsAppAccountModal
          onClose={() => setShowCreateModal(false)}
          onCreate={handleCreateAccount}
          isLoading={createMutation.isPending}
        />
      )}

      {showQRModal && selectedAccount && (
        <QRCodeModal
          account={selectedAccount}
          onClose={() => {
            setShowQRModal(false);
            setSelectedAccount(null);
          }}
        />
      )}

      {showSendMessageModal && selectedAccount && (
        <SendMessageModal
          account={selectedAccount}
          onClose={() => {
            setShowSendMessageModal(false);
            setSelectedAccount(null);
          }}
        />
      )}
    </div>
  );
}

// Create WhatsApp Account Modal
function CreateWhatsAppAccountModal({
  onClose,
  onCreate,
  isLoading,
}: {
  onClose: () => void;
  onCreate: (data: CreateWhatsAppAccount) => void;
  isLoading: boolean;
}) {
  const [formData, setFormData] = useState<CreateWhatsAppAccount>({
    name: '',
    instanceName: '',
    apiUrl: '',
    apiKey: '',
    webhookUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.instanceName.trim() || !formData.apiUrl.trim() || !formData.apiKey.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold text-foreground mb-4">Add WhatsApp Account</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Account Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="My WhatsApp Business"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Instance Name *
            </label>
            <input
              type="text"
              required
              value={formData.instanceName}
              onChange={(e) => setFormData({ ...formData, instanceName: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="my-business-instance"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Unique identifier for this instance
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Evolution API URL *
            </label>
            <input
              type="url"
              required
              value={formData.apiUrl}
              onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="https://api.evolution.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              API Key *
            </label>
            <input
              type="text"
              required
              value={formData.apiKey}
              onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground font-mono text-sm"
              placeholder="your-api-key"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Webhook URL (Optional)
            </label>
            <input
              type="url"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="https://yourdomain.com/webhook"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Leave empty to use default webhook endpoint
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Creating...' : 'Create Account'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// QR Code Modal with Auto-Refresh
function QRCodeModal({
  account,
  onClose,
}: {
  account: WhatsAppAccount;
  onClose: () => void;
}) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let statusInterval: NodeJS.Timeout;

    const fetchQRCode = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await api.getWhatsAppQRCode(account.id);
        setQrCode(data.qrCode);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to fetch QR code:', err);
        setError(err.message || 'Failed to fetch QR code');
        setIsLoading(false);
      }
    };

    const checkStatus = async () => {
      try {
        const status = await api.getWhatsAppStatus(account.id);

        // If connected, refresh accounts list and close modal
        if (status.state === 'open' || status.instance?.state === 'open') {
          toast.success('WhatsApp connected successfully!');
          queryClient.invalidateQueries({ queryKey: ['whatsapp-accounts'] });
          onClose();
        }
      } catch (err) {
        console.error('Failed to check status:', err);
      }
    };

    // Initial fetch
    fetchQRCode();

    // Auto-refresh QR code every 30 seconds (QR codes expire)
    interval = setInterval(fetchQRCode, 30000);

    // Check connection status every 3 seconds
    statusInterval = setInterval(checkStatus, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(statusInterval);
    };
  }, [account.id, onClose, queryClient]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">Scan QR Code</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg">
            <p className="text-sm text-foreground mb-2">
              <strong>{account.name}</strong>
            </p>
            <p className="text-xs text-muted-foreground">{account.instanceName}</p>
          </div>

          {/* QR Code Display */}
          <div className="flex items-center justify-center bg-white p-6 rounded-lg min-h-[300px]">
            {isLoading && (
              <div className="text-center">
                <RefreshCw className="h-8 w-8 text-primary animate-spin mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Loading QR code...</p>
              </div>
            )}

            {error && (
              <div className="text-center">
                <p className="text-sm text-red-500 mb-2">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="text-sm text-primary hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {qrCode && !isLoading && !error && (
              <img
                src={qrCode}
                alt="WhatsApp QR Code"
                className="max-w-full h-auto"
              />
            )}
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2">How to connect:</h3>
            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
              <li>Open WhatsApp on your phone</li>
              <li>Tap Menu or Settings and select Linked Devices</li>
              <li>Tap on Link a Device</li>
              <li>Point your phone at this screen to scan the QR code</li>
            </ol>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <RefreshCw className="h-3 w-3 animate-spin" />
            <span>Auto-checking connection status...</span>
          </div>

          <button
            onClick={onClose}
            className="w-full px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Send Message Modal
function SendMessageModal({
  account,
  onClose,
}: {
  account: WhatsAppAccount;
  onClose: () => void;
}) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber.trim() || !message.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsSending(true);
      await api.sendWhatsAppMessage(account.id, {
        to: phoneNumber,
        text: message,
      });
      toast.success('Message sent successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">Send Test Message</h2>

        <div className="bg-muted/50 p-3 rounded-lg mb-4">
          <p className="text-sm text-foreground">
            <strong>{account.name}</strong>
          </p>
          <p className="text-xs text-muted-foreground">{account.instanceName}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Phone Number *
            </label>
            <input
              type="tel"
              required
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="+1234567890 or 1234567890"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Include country code (e.g., +1 for US)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Message *
            </label>
            <textarea
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
              placeholder="Type your message here..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              {message.length} characters
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              disabled={isSending}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {isSending ? 'Sending...' : 'Send Message'}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
