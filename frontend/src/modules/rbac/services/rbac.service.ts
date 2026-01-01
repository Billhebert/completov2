import api from '@/core/utils/api';

/**
 * Service for RBAC management. Exposes methods to manage departments, roles,
 * role permissions, user permissions and audit logs. Each method maps to a
 * corresponding route in the backend RBAC module【921379821264927†L21-L94】.
 */
class RbacService {
  // ======================== Departments ========================

  /**
   * List all active departments within the current company【921379821264927†L27-L53】.
   */
  async listDepartments() {
    const { data } = await api.get('/rbac/departments');
    return data?.data;
  }

  /**
   * Create a new department【921379821264927†L60-L113】. Requires admin privileges.
   *
   * @param payload Department data { name, description, parentId, metadata }
   */
  async createDepartment(payload: {
    name: string;
    description?: string;
    parentId?: string | null;
    metadata?: any;
  }) {
    const { data } = await api.post('/rbac/departments', payload);
    return data?.data;
  }

  /**
   * Update an existing department【921379821264927†L120-L160】.
   *
   * @param id Department identifier
   * @param payload Partial department fields to update
   */
  async updateDepartment(id: string, payload: {
    name?: string;
    description?: string;
    parentId?: string | null;
    isActive?: boolean;
    metadata?: any;
  }) {
    const { data } = await api.put(`/rbac/departments/${id}`, payload);
    return data?.data;
  }

  /**
   * Delete a department【921379821264927†L167-L223】. Will error if the department
   * has subdepartments or assigned users.
   *
   * @param id Department identifier
   */
  async deleteDepartment(id: string) {
    const { data } = await api.delete(`/rbac/departments/${id}`);
    return data?.message;
  }

  /**
   * Assign a user to a department【921379821264927†L226-L289】. When `isPrimary`
   * is true, existing primary assignments will be cleared.
   *
   * @param departmentId Department id
   * @param payload { userId, isPrimary }
   */
  async addUserToDepartment(
    departmentId: string,
    payload: { userId: string; isPrimary?: boolean }
  ) {
    const { data } = await api.post(`/rbac/departments/${departmentId}/users`, payload);
    return data?.data;
  }

  // ======================== Custom Roles ========================

  /**
   * List custom roles in the company【921379821264927†L299-L322】.
   */
  async listRoles() {
    const { data } = await api.get('/rbac/roles');
    return data?.data;
  }

  /**
   * Create a custom role【921379821264927†L329-L361】.
   *
   * @param payload Role data { name, description, level, metadata }
   */
  async createRole(payload: {
    name: string;
    description?: string;
    level?: number;
    metadata?: any;
  }) {
    const { data } = await api.post('/rbac/roles', payload);
    return data?.data;
  }

  /**
   * Update an existing role【921379821264927†L368-L405】.
   *
   * @param id Role ID
   * @param payload Fields to update { name, description, level, isActive, metadata }
   */
  async updateRole(id: string, payload: {
    name?: string;
    description?: string;
    level?: number;
    isActive?: boolean;
    metadata?: any;
  }) {
    const { data } = await api.put(`/rbac/roles/${id}`, payload);
    return data?.data;
  }

  /**
   * Delete a custom role【921379821264927†L413-L460】.
   *
   * @param id Role ID
   */
  async deleteRole(id: string) {
    const { data } = await api.delete(`/rbac/roles/${id}`);
    return data?.message;
  }

  // ======================== Role Permissions ========================

  /**
   * List permissions assigned to a custom role【921379821264927†L471-L485】.
   *
   * @param roleId Role identifier
   */
  async getRolePermissions(roleId: string) {
    const { data } = await api.get(`/rbac/roles/${roleId}/permissions`);
    return data?.data;
  }

  /**
   * Add a permission to a role【921379821264927†L493-L537】.
   *
   * @param roleId Role identifier
   * @param payload { resource, action, conditions }
   */
  async addRolePermission(roleId: string, payload: {
    resource: string;
    action: string;
    conditions?: any;
  }) {
    const { data } = await api.post(`/rbac/roles/${roleId}/permissions`, payload);
    return data?.data;
  }

  /**
   * Remove a permission from a role【921379821264927†L545-L579】.
   *
   * @param roleId Role identifier
   * @param permId Permission identifier
   */
  async removeRolePermission(roleId: string, permId: string) {
    const { data } = await api.delete(`/rbac/roles/${roleId}/permissions/${permId}`);
    return data?.message;
  }

  // ======================== User Permissions ========================

  /**
   * Get the effective permissions for a user【921379821264927†L590-L616】.
   *
   * @param userId User identifier
   */
  async getUserPermissions(userId: string) {
    const { data } = await api.get(`/rbac/users/${userId}/permissions`);
    return data?.data;
  }

  /**
   * Grant or revoke a specific permission for a user【921379821264927†L623-L687】.
   *
   * @param userId User identifier
   * @param payload { resource, action, granted, conditions, reason, expiresAt }
   */
  async setUserPermission(
    userId: string,
    payload: {
      resource: string;
      action: string;
      granted?: boolean;
      conditions?: any;
      reason?: string;
      expiresAt?: string;
    }
  ) {
    const { data } = await api.post(`/rbac/users/${userId}/permissions`, payload);
    return data?.data;
  }

  /**
   * Assign a custom role to a user【921379821264927†L694-L749】.
   *
   * @param userId User identifier
   * @param customRoleId Custom role ID or null to remove
   */
  async assignUserRole(userId: string, customRoleId: string | null) {
    const { data } = await api.put(`/rbac/users/${userId}/role`, { customRoleId });
    return data?.data;
  }

  // ======================== Audit Logs ========================

  /**
   * Retrieve permission audit logs【921379821264927†L760-L789】.
   *
   * @param params Optional filters { entityType, entityId, limit }
   */
  async getAuditLogs(params?: { entityType?: string; entityId?: string; limit?: number }) {
    const { data } = await api.get('/rbac/audit', { params });
    return data?.data;
  }
}

export const rbacService = new RbacService();
export default rbacService;