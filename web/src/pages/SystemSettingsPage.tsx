// web/src/pages/SystemSettingsPage.tsx
import React, { useEffect, useState } from 'react';
import { useServicesStore } from '../store/servicesStore';

export const SystemSettingsPage: React.FC = () => {
  const {
    systemSettings,
    isLoading,
    error,
    fetchSystemSettings,
    updateSystemSettings,
    clearError,
  } = useServicesStore();

  const [isEditing, setIsEditing] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    serviceFeePercentage: 10.0,
    minServiceFee: 5.0,
    maxServiceFee: undefined as number | undefined,
    currency: 'BRL',
    metadata: null as any,
  });

  useEffect(() => {
    fetchSystemSettings();
  }, []);

  useEffect(() => {
    if (systemSettings) {
      setSettingsForm({
        serviceFeePercentage: systemSettings.serviceFeePercentage,
        minServiceFee: systemSettings.minServiceFee,
        maxServiceFee: systemSettings.maxServiceFee || undefined,
        currency: systemSettings.currency,
        metadata: systemSettings.metadata,
      });
    }
  }, [systemSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateSystemSettings(settingsForm);
      setIsEditing(false);
      await fetchSystemSettings();
      alert('System settings updated successfully!');
    } catch (err) {
      console.error('Failed to update system settings:', err);
    }
  };

  const calculateFeeExample = (amount: number) => {
    const feePercentage = settingsForm.serviceFeePercentage / 100;
    let fee = amount * feePercentage;

    if (fee < settingsForm.minServiceFee) {
      fee = settingsForm.minServiceFee;
    }

    if (settingsForm.maxServiceFee && fee > settingsForm.maxServiceFee) {
      fee = settingsForm.maxServiceFee;
    }

    return fee;
  };

  return (
    <div className="system-settings-page p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">System Settings</h1>
        <span className="bg-red-100 text-red-800 px-3 py-1 rounded text-sm font-medium">
          DEV / Admin Only
        </span>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
          <button onClick={clearError} className="float-right">×</button>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Service Fee Configuration</h2>
          <p className="text-gray-600 mb-6">
            Configure the platform fees charged on service transactions. These fees are automatically
            calculated when a service proposal is accepted.
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6">
              {/* Fee Percentage */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Service Fee Percentage (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                  value={settingsForm.serviceFeePercentage}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    serviceFeePercentage: Number(e.target.value)
                  })}
                  disabled={!isEditing}
                  className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  The percentage of the service value charged as a platform fee
                </p>
              </div>

              {/* Minimum Fee */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Minimum Service Fee ({settingsForm.currency})
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settingsForm.minServiceFee}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    minServiceFee: Number(e.target.value)
                  })}
                  disabled={!isEditing}
                  className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  The minimum fee charged, even if the percentage would be lower
                </p>
              </div>

              {/* Maximum Fee */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Service Fee ({settingsForm.currency}) <span className="text-gray-400">(Optional)</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={settingsForm.maxServiceFee || ''}
                  onChange={(e) => setSettingsForm({
                    ...settingsForm,
                    maxServiceFee: e.target.value ? Number(e.target.value) : undefined
                  })}
                  disabled={!isEditing}
                  className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="No maximum"
                />
                <p className="text-sm text-gray-500 mt-1">
                  The maximum fee charged, capping the percentage calculation (leave empty for no cap)
                </p>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium mb-2">Currency</label>
                <select
                  value={settingsForm.currency}
                  onChange={(e) => setSettingsForm({ ...settingsForm, currency: e.target.value })}
                  disabled={!isEditing}
                  className="w-full border rounded px-3 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="BRL">BRL (Brazilian Real)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                </select>
              </div>
            </div>

            {/* Fee Calculator */}
            <div className="mt-8 bg-blue-50 rounded-lg p-6">
              <h3 className="font-semibold mb-4">Fee Calculator</h3>
              <p className="text-sm text-gray-600 mb-4">
                See how fees would be calculated with the current settings:
              </p>

              <div className="space-y-3">
                {[100, 500, 1000, 5000, 10000].map((amount) => {
                  const fee = calculateFeeExample(amount);
                  const total = amount + fee;
                  const percentage = (fee / amount) * 100;

                  return (
                    <div key={amount} className="flex justify-between items-center py-2 border-b border-blue-200">
                      <span className="font-medium">
                        Service: {settingsForm.currency} {amount.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Fee: {settingsForm.currency} {fee.toFixed(2)} ({percentage.toFixed(1)}%)
                      </span>
                      <span className="font-semibold text-green-600">
                        Total: {settingsForm.currency} {total.toFixed(2)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-6">
              {!isEditing ? (
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Edit Settings
                </button>
              ) : (
                <>
                  <button
                    type="submit"
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      if (systemSettings) {
                        setSettingsForm({
                          serviceFeePercentage: systemSettings.serviceFeePercentage,
                          minServiceFee: systemSettings.minServiceFee,
                          maxServiceFee: systemSettings.maxServiceFee || undefined,
                          currency: systemSettings.currency,
                          metadata: systemSettings.metadata,
                        });
                      }
                    }}
                    className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                </>
              )}
            </div>
          </form>

          {/* Current Settings Summary */}
          {systemSettings && (
            <div className="mt-8 pt-6 border-t">
              <h3 className="font-semibold mb-3">Current Configuration</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Fee Percentage:</span>
                  <span className="ml-2 font-medium">{systemSettings.serviceFeePercentage}%</span>
                </div>
                <div>
                  <span className="text-gray-600">Minimum Fee:</span>
                  <span className="ml-2 font-medium">
                    {systemSettings.currency} {systemSettings.minServiceFee.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Maximum Fee:</span>
                  <span className="ml-2 font-medium">
                    {systemSettings.maxServiceFee
                      ? `${systemSettings.currency} ${systemSettings.maxServiceFee.toFixed(2)}`
                      : 'No limit'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <span className="ml-2 font-medium">
                    {new Date(systemSettings.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Warning Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
        <div className="flex items-start">
          <span className="text-yellow-600 text-2xl mr-3">⚠️</span>
          <div>
            <h4 className="font-semibold text-yellow-800 mb-1">Important Notice</h4>
            <p className="text-sm text-yellow-700">
              Changes to these settings will affect all new service transactions. Existing in-progress
              transactions will not be affected. Use caution when modifying these values as they
              directly impact platform revenue.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;
