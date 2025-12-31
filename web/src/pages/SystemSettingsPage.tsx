import { useState, useEffect } from 'react';
import { Settings, DollarSign, Percent, Save } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

interface SystemSettings {
  serviceFeePercentage: number;
  minServiceFee: number;
  maxServiceFee: number;
  currency: string;
  metadata?: any;
}

export default function SystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    serviceFeePercentage: 10,
    minServiceFee: 50,
    maxServiceFee: 10000,
    currency: 'BRL',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await api.getSystemSettings();
      setSettings(data);
    } catch (error: any) {
      toast.error('Failed to load settings');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.updateSystemSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setIsSaving(false);
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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Settings className="h-8 w-8" />
            System Settings
          </h1>
          <p className="text-muted-foreground mt-2">
            Configure global system parameters
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center gap-2 mb-4">
          <DollarSign className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Service Marketplace Fees</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Service Fee Percentage
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={settings.serviceFeePercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    serviceFeePercentage: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 pr-10 border border-border rounded-lg bg-background text-foreground"
              />
              <Percent className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Platform fee charged on each service transaction
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="BRL">BRL (Brazilian Real)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="GBP">GBP (British Pound)</option>
            </select>
            <p className="text-xs text-muted-foreground mt-1">
              Default currency for all transactions
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Minimum Service Fee ({settings.currency})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.minServiceFee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  minServiceFee: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Minimum fee to charge regardless of percentage
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Maximum Service Fee ({settings.currency})
            </label>
            <input
              type="number"
              min="0"
              step="1"
              value={settings.maxServiceFee}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  maxServiceFee: parseFloat(e.target.value) || 0,
                })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Maximum fee cap for high-value services
            </p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="text-sm font-medium text-foreground mb-2">Fee Calculation Example</h3>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              Service Value: {settings.currency} 1,000 →{' '}
              <span className="font-medium text-foreground">
                Fee: {settings.currency}{' '}
                {Math.min(
                  Math.max(
                    (1000 * settings.serviceFeePercentage) / 100,
                    settings.minServiceFee
                  ),
                  settings.maxServiceFee
                ).toFixed(2)}
              </span>
            </p>
            <p>
              Service Value: {settings.currency} 100,000 →{' '}
              <span className="font-medium text-foreground">
                Fee: {settings.currency}{' '}
                {Math.min(
                  Math.max(
                    (100000 * settings.serviceFeePercentage) / 100,
                    settings.minServiceFee
                  ),
                  settings.maxServiceFee
                ).toFixed(2)}
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
