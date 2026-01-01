/**
 * RBAC Types
 * Tipos para gestão de permissões e roles
 */

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean; // Roles do sistema não podem ser deletadas
  usersCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'manage';
  createdAt: string;
}

export interface RoleAssignment {
  id: string;
  userId: string;
  userName: string;
  roleId: string;
  roleName: string;
  assignedBy: string;
  assignedAt: string;
  expiresAt?: string;
}

export interface CreateRoleRequest {
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleFilters {
  search?: string;
  isSystem?: boolean;
}
