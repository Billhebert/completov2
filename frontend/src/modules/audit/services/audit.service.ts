import api from '../../../core/utils/api';

/**
 * Audit service
 *
 * This service wraps the audit endpoints provided by the backend. It allows
 * administrators to query audit logs, inspect the history of specific
 * entities, view user activity over time, retrieve aggregate statistics and
 * export a CSV of audit events. The backend exposes these routes under
 * `/api/v1/audit` and enforces authentication and tenant isolation.
 *
 * Available operations:
 * - **getCompanyLogs**: list audit logs filtered by action, entity type, user,
 *   date range and an optional limit. The backend returns log entries with
 *   timestamps, user info, action, entity details and metadata【907320219910051†L11-L28】.
 * - **getEntityHistory**: return change history for a specific entity type
 *   and ID【907320219910051†L34-L47】.
 * - **getUserActivity**: return activity logs for a given user within an
 *   optional date range【907320219910051†L53-L68】.
 * - **getAuditStats**: retrieve aggregate statistics including total count,
 *   counts by action and entity type, and top users【907320219910051†L73-L109】.
 * - **exportAuditLogs**: export logs to CSV within a date range. The backend
 *   returns a CSV string; this function returns the plain text【907320219910051†L112-L139】.
 */

export interface AuditQueryParams {
  action?: string;
  entityType?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface AuditHistoryQuery {
  limit?: number;
}

export interface UserActivityQuery {
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export interface AuditStats {
  total: number;
  byAction: Array<{ action: string; _count: { id: number } }>;
  byEntity: Array<{ entityType: string; _count: { id: number } }>;
  topUsers: Array<{ userId: string; _count: { id: number } }>;
}

class AuditService {
  private baseUrl = '/audit';

  /**
   * Fetch company audit logs with optional filters. If no filters are
   * provided the backend will return up to 100 recent entries by default.
   */
  async getCompanyLogs(params: AuditQueryParams = {}) {
    const response = await api.get(`${this.baseUrl}/logs`, { params });
    return response.data.data;
  }

  /**
   * Retrieve the change history for a specific entity. This is useful to
   * inspect who changed an entity and when. You may optionally limit the
   * number of history entries returned (default is 50)【907320219910051†L34-L47】.
   */
  async getEntityHistory(entityType: string, entityId: string, query: AuditHistoryQuery = {}) {
    const response = await api.get(`${this.baseUrl}/history/${entityType}/${entityId}`, { params: query });
    return response.data.data;
  }

  /**
   * Get audit logs for a specific user. You can filter by date range and
   * optionally limit the number of entries returned【907320219910051†L54-L68】.
   */
  async getUserActivity(userId: string, query: UserActivityQuery = {}) {
    const response = await api.get(`${this.baseUrl}/activity/${userId}`, { params: query });
    return response.data.data;
  }

  /**
   * Retrieve aggregated audit statistics including totals and breakdowns by
   * action, entity type and top users【907320219910051†L73-L109】.
   */
  async getAuditStats(): Promise<AuditStats> {
    const response = await api.get(`${this.baseUrl}/stats`);
    return response.data.data;
  }

  /**
   * Export audit logs as CSV. The backend returns a plain text CSV with
   * headers and rows【907320219910051†L112-L139】. If you wish to download a file in
   * the browser you may need to convert this string into a Blob and
   * initiate a download on the client side.
   */
  async exportAuditLogs(params: { startDate?: string; endDate?: string } = {}): Promise<string> {
    const response = await api.get(`${this.baseUrl}/export`, {
      params,
      responseType: 'text',
    });
    return response.data as string;
  }
}

export const auditService = new AuditService();

export default auditService;