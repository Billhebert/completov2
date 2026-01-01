import api from '@/core/utils/api';

/**
 * Service for managing partnerships between companies. These functions wrap
 * the REST API defined in the backend partnerships module, enabling listing,
 * retrieval, creation, updating, termination, and invitation management【248304023045659†L16-L60】.
 */
class PartnershipsService {
  /**
   * List partnerships the current company is involved in【248304023045659†L16-L60】.
   * Optional filters include status and pagination.
   *
   * @param params Query parameters { status, page, pageSize }
   */
  async listPartnerships(params?: { status?: string; page?: number; pageSize?: number }) {
    const { data } = await api.get('/partnerships', { params });
    return data;
  }

  /**
   * Retrieve a specific partnership by ID【248304023045659†L63-L93】.
   *
   * @param id Partnership identifier
   */
  async getPartnership(id: string) {
    const { data } = await api.get(`/partnerships/${id}`);
    return data;
  }

  /**
   * Create a new partnership directly (usually after accepting an invite)【248304023045659†L95-L155】.
   * Only admins or DEV roles can call this endpoint.
   *
   * @param payload Partnership creation data
   */
  async createPartnership(payload: {
    partnerCompanyId: string;
    name: string;
    description?: string;
    type?: string;
    shareJobs?: boolean;
    shareServices?: boolean;
    shareResources?: boolean;
    terms?: any;
  }) {
    const { data } = await api.post('/partnerships', payload);
    return data;
  }

  /**
   * Update an existing partnership【248304023045659†L161-L206】.
   *
   * @param id Partnership ID
   * @param payload Fields to update (name, description, shareJobs, shareServices, shareResources, status, endDate)
   */
  async updatePartnership(id: string, payload: {
    name?: string;
    description?: string;
    shareJobs?: boolean;
    shareServices?: boolean;
    shareResources?: boolean;
    status?: string;
    endDate?: string;
  }) {
    const { data } = await api.patch(`/partnerships/${id}`, payload);
    return data;
  }

  /**
   * Terminate a partnership (soft delete)【248304023045659†L212-L247】.
   *
   * @param id Partnership ID
   */
  async terminatePartnership(id: string) {
    const response = await api.delete(`/partnerships/${id}`);
    return response.data;
  }

  /**
   * List partnership invites (sent or received)【248304023045659†L257-L303】.
   * Use the `type` param to filter by sent/received.
   *
   * @param params Query params { type, status, page, pageSize }
   */
  async listInvites(params?: { type?: string; status?: string; page?: number; pageSize?: number }) {
    const { data } = await api.get('/partnerships/invites', { params });
    return data;
  }

  /**
   * Send a partnership invite to another company【248304023045659†L310-L381】.
   *
   * @param payload Invite data
   */
  async sendInvite(payload: {
    toCompanyId: string;
    message?: string;
    shareJobs?: boolean;
    shareServices?: boolean;
    shareResources?: boolean;
    proposedTerms?: any;
    expiresAt?: string;
  }) {
    const { data } = await api.post('/partnerships/invites', payload);
    return data;
  }

  /**
   * Accept a partnership invite【248304023045659†L388-L455】.
   *
   * @param id Invite identifier
   */
  async acceptInvite(id: string) {
    const { data } = await api.patch(`/partnerships/invites/${id}/accept`);
    return data;
  }

  /**
   * Reject a partnership invite【248304023045659†L462-L497】.
   * Optionally provide a rejection reason.
   *
   * @param id Invite identifier
   * @param reason Reason for rejection
   */
  async rejectInvite(id: string, reason?: string) {
    const { data } = await api.patch(`/partnerships/invites/${id}/reject`, { reason });
    return data;
  }
}

export const partnershipsService = new PartnershipsService();
export default partnershipsService;