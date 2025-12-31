// RBAC Types

export interface Department {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  parentId?: string | null;
  parent?: Department | null;
  children?: Department[];
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    userDepartments: number;
    departmentPermissions: number;
  };
}

export interface CustomRole {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  level: number;
  isSystem: boolean;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    rolePermissions: number;
    departmentPermissions: number;
  };
}

export interface RolePermission {
  id: string;
  roleId: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  createdAt: string;
  role?: CustomRole;
}

export interface UserPermission {
  id: string;
  userId: string;
  resource: string;
  action: string;
  granted: boolean;
  conditions?: Record<string, any>;
  reason?: string;
  grantedBy: string;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserDepartment {
  id: string;
  userId: string;
  departmentId: string;
  isPrimary: boolean;
  assignedBy: string;
  assignedAt: string;
  department?: Department;
}

export interface PermissionAudit {
  id: string;
  companyId: string;
  entityType: 'user' | 'role' | 'department';
  entityId: string;
  action: 'grant' | 'revoke' | 'update';
  resource: string;
  permission: string;
  oldValue?: any;
  newValue?: any;
  changedBy: string;
  reason?: string;
  timestamp: string;
}

export interface UserPermissions {
  role: string;
  customRole?: {
    id: string;
    name: string;
    level: number;
  };
  departments: Array<{
    id: string;
    name: string;
    isPrimary: boolean;
  }>;
  permissions: Array<{
    resource: string;
    action: string;
    source: string;
  }>;
}

export interface CreateDepartment {
  name: string;
  description?: string;
  parentId?: string;
  metadata?: Record<string, any>;
}

export interface CreateCustomRole {
  name: string;
  description?: string;
  level?: number;
  metadata?: Record<string, any>;
}

export interface CreateRolePermission {
  resource: string;
  action: string;
  conditions?: Record<string, any>;
}

export interface CreateUserPermission {
  resource: string;
  action: string;
  granted?: boolean;
  conditions?: Record<string, any>;
  reason?: string;
  expiresAt?: string;
}

export interface AddUserToDepartment {
  userId: string;
  isPrimary?: boolean;
}
