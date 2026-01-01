import api from '@/core/utils/api';

/**
 * Service for system settings. The backend restricts these endpoints to
 * developers and administrators【240892291532403†L16-L25】. Use this service to
 * retrieve the current settings, update them, and fetch their history.
 */
class SettingsService {
  /**
   * Retrieve the current system settings. If none exist, defaults are
   * returned by the backend【240892291532403†L16-L39】.
   */
  async getSystemSettings() {
    const { data } = await api.get('/settings');
    return data;
  }

  /**
   * Update the system settings. Only allowed for DEV and admin roles【240892291532403†L49-L124】.
   * Pass only the fields you wish to change; the backend validates ranges
   * for service fee percentage and fee values.
   *
   * @param payload Partial settings fields
   */
  async updateSystemSettings(payload: {
    serviceFeePercentage?: number;
    minServiceFee?: number;
    maxServiceFee?: number | null;
    currency?: string;
    metadata?: any;
  }) {
    const { data } = await api.put('/settings', payload);
    return data;
  }

  /**
   * Retrieve the history of system settings changes【240892291532403†L131-L166】.
   *
   * @param params Optional pagination parameters { page, pageSize }
   */
  async getSettingsHistory(params?: { page?: number; pageSize?: number }) {
    const { data } = await api.get('/settings/history', { params });
    return data;
  }
}

export const settingsService = new SettingsService();
export default settingsService;