import api from '@/core/utils/api';

/**
 * Service for managing API keys. These keys allow machine‑to‑machine access
 * to the API and should be handled carefully. The service exposes methods
 * corresponding to the backend routes defined in the `apikeys` module【20537008925849†L14-L154】.
 */
class ApiKeysService {
  /**
   * List all API keys for the current company【20537008925849†L17-L35】.
   */
  async listApiKeys() {
    const { data } = await api.get('/apikeys');
    return data?.data;
  }

  /**
   * Create a new API key. Only admins or devs may call this. The backend
   * returns the plain text `key` only once; clients must store it safely【20537008925849†L42-L75】.
   *
   * @param payload Object with name, scopes and optional expiration date
   */
  async createApiKey(payload: {
    name: string;
    scopes: string[];
    expiresAt?: string;
  }) {
    const { data } = await api.post('/apikeys', payload);
    return data?.data;
  }

  /**
   * Revoke an API key so it can no longer be used【20537008925849†L82-L93】.
   *
   * @param id Identifier of the API key
   */
  async revokeApiKey(id: string) {
    const { data } = await api.post(`/apikeys/${id}/revoke`);
    return data?.message;
  }

  /**
   * Delete an API key permanently【20537008925849†L99-L109】.
   *
   * @param id Identifier of the API key
   */
  async deleteApiKey(id: string) {
    const { data } = await api.delete(`/apikeys/${id}`);
    return data?.message;
  }

  /**
   * Get usage statistics for an API key【20537008925849†L115-L151】.
   *
   * @param id API key ID
   */
  async getApiKeyUsage(id: string) {
    const { data } = await api.get(`/apikeys/${id}/usage`);
    return data?.data;
  }
}

export const apiKeysService = new ApiKeysService();
export default apiKeysService;