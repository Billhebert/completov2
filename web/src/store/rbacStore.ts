// web/src/store/rbacStore.ts
import { create } from 'zustand';
import type {
  Department,
  CustomRole,
  RolePermission,
  PermissionAudit,
  CreateDepartment,
  CreateCustomRole,
  CreateRolePermission,
  AddUserToDepartment,
} from '../types/rbac';
import api from '../services/api';

interface RBACState {
  // State
  departments: Department[];
  roles: CustomRole[];
  selectedRole: CustomRole | null;
  rolePermissions: RolePermission[];
  audits: PermissionAudit[];
  isLoading: boolean;
  error: string | null;

  // Actions - Departments
  fetchDepartments: () => Promise<void>;
  createDepartment: (data: CreateDepartment) => Promise<Department>;
  updateDepartment: (id: string, data: Partial<CreateDepartment> & { isActive?: boolean }) => Promise<Department>;
  deleteDepartment: (id: string) => Promise<void>;
  addUserToDepartment: (departmentId: string, data: AddUserToDepartment) => Promise<void>;

  // Actions - Roles
  fetchRoles: () => Promise<void>;
  createRole: (data: CreateCustomRole) => Promise<CustomRole>;
  updateRole: (id: string, data: Partial<CreateCustomRole> & { isActive?: boolean }) => Promise<CustomRole>;
  deleteRole: (id: string) => Promise<void>;
  selectRole: (role: CustomRole | null) => void;

  // Actions - Role Permissions
  fetchRolePermissions: (roleId: string) => Promise<void>;
  addRolePermission: (roleId: string, data: CreateRolePermission) => Promise<RolePermission>;
  deleteRolePermission: (roleId: string, permissionId: string) => Promise<void>;

  // Actions - Audit
  fetchAudits: (params?: {
    entityType?: string;
    entityId?: string;
    limit?: number;
  }) => Promise<void>;

  clearError: () => void;
}

export const useRBACStore = create<RBACState>((set, get) => ({
  // Initial state
  departments: [],
  roles: [],
  selectedRole: null,
  rolePermissions: [],
  audits: [],
  isLoading: false,
  error: null,

  // Departments actions
  fetchDepartments: async () => {
    set({ isLoading: true, error: null });
    try {
      const departments = await api.getDepartments();
      set({ departments, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createDepartment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const department = await api.createDepartment(data);
      set((state) => ({
        departments: [...state.departments, department],
        isLoading: false,
      }));
      return department;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateDepartment: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const department = await api.updateDepartment(id, data);
      set((state) => ({
        departments: state.departments.map((d) => (d.id === id ? department : d)),
        isLoading: false,
      }));
      return department;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteDepartment: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteDepartment(id);
      set((state) => ({
        departments: state.departments.filter((d) => d.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addUserToDepartment: async (departmentId, data) => {
    set({ isLoading: true, error: null });
    try {
      await api.addUserToDepartment(departmentId, data);
      set({ isLoading: false });
      // Optionally refetch departments to update counts
      await get().fetchDepartments();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Roles actions
  fetchRoles: async () => {
    set({ isLoading: true, error: null });
    try {
      const roles = await api.getCustomRoles();
      set({ roles, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  createRole: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const role = await api.createCustomRole(data);
      set((state) => ({
        roles: [...state.roles, role],
        isLoading: false,
      }));
      return role;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  updateRole: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const role = await api.updateCustomRole(id, data);
      set((state) => ({
        roles: state.roles.map((r) => (r.id === id ? role : r)),
        isLoading: false,
      }));
      return role;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteRole: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteCustomRole(id);
      set((state) => ({
        roles: state.roles.filter((r) => r.id !== id),
        selectedRole: state.selectedRole?.id === id ? null : state.selectedRole,
        isLoading: false,
      }));
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectRole: (role) => {
    set({ selectedRole: role });
  },

  // Role Permissions actions
  fetchRolePermissions: async (roleId) => {
    set({ isLoading: true, error: null });
    try {
      const permissions = await api.getRolePermissions(roleId);
      set({ rolePermissions: permissions, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addRolePermission: async (roleId, data) => {
    set({ isLoading: true, error: null });
    try {
      const permission = await api.addRolePermission(roleId, data);
      set((state) => ({
        rolePermissions: [...state.rolePermissions, permission],
        isLoading: false,
      }));
      // Refetch roles to update permission counts
      await get().fetchRoles();
      return permission;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  deleteRolePermission: async (roleId, permissionId) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteRolePermission(roleId, permissionId);
      set((state) => ({
        rolePermissions: state.rolePermissions.filter((p) => p.id !== permissionId),
        isLoading: false,
      }));
      // Refetch roles to update permission counts
      await get().fetchRoles();
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  // Audit actions
  fetchAudits: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const audits = await api.getPermissionAudits(params);
      set({ audits, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));
