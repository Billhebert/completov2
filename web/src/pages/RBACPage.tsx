// web/src/pages/RBACPage.tsx
import { useEffect, useState } from 'react';
import {
  Shield,
  Users,
  Key,
  FileText,
  Plus,
  Trash2,
  Edit2,
  Eye,
  ChevronRight,
  Calendar,
  UserPlus,
  X,
} from 'lucide-react';
import { useRBACStore } from '../store/rbacStore';
import type {
  CreateDepartment,
  CreateCustomRole,
  CreateRolePermission,
  Department,
  CustomRole,
} from '../types/rbac';
import toast from 'react-hot-toast';

type TabType = 'departments' | 'roles' | 'audit';

export default function RBACPage() {
  const {
    departments,
    roles,
    selectedRole,
    rolePermissions,
    audits,
    isLoading,
    fetchDepartments,
    createDepartment,
    deleteDepartment,
    addUserToDepartment,
    fetchRoles,
    createRole,
    deleteRole,
    selectRole,
    fetchRolePermissions,
    addRolePermission,
    deleteRolePermission,
    fetchAudits,
  } = useRBACStore();

  const [selectedTab, setSelectedTab] = useState<TabType>('departments');
  const [showCreateDepartmentModal, setShowCreateDepartmentModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [showViewPermissionsModal, setShowViewPermissionsModal] = useState(false);
  const [showAddPermissionModal, setShowAddPermissionModal] = useState(false);
  const [auditFilters, setAuditFilters] = useState({
    entityType: '',
    entityId: '',
    limit: 100,
  });

  useEffect(() => {
    fetchDepartments();
    fetchRoles();
    fetchAudits({ limit: 100 });
  }, []);

  const handleCreateDepartment = async (data: CreateDepartment) => {
    try {
      await createDepartment(data);
      toast.success('Department created successfully');
      setShowCreateDepartmentModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create department');
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!confirm('Are you sure you want to delete this department?')) return;
    try {
      await deleteDepartment(id);
      toast.success('Department deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete department');
    }
  };

  const handleAddUserToDepartment = async (data: { userId: string; isPrimary?: boolean }) => {
    if (!selectedDepartment) return;
    try {
      await addUserToDepartment(selectedDepartment.id, data);
      toast.success('User added to department successfully');
      setShowAddUserModal(false);
      setSelectedDepartment(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add user to department');
    }
  };

  const handleCreateRole = async (data: CreateCustomRole) => {
    try {
      await createRole(data);
      toast.success('Role created successfully');
      setShowCreateRoleModal(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create role');
    }
  };

  const handleDeleteRole = async (id: string, isSystem: boolean) => {
    if (isSystem) {
      toast.error('Cannot delete system role');
      return;
    }
    if (!confirm('Are you sure you want to delete this role?')) return;
    try {
      await deleteRole(id);
      toast.success('Role deleted successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete role');
    }
  };

  const handleViewPermissions = async (role: CustomRole) => {
    selectRole(role);
    try {
      await fetchRolePermissions(role.id);
      setShowViewPermissionsModal(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to load permissions');
    }
  };

  const handleAddPermission = async (data: CreateRolePermission) => {
    if (!selectedRole) return;
    try {
      await addRolePermission(selectedRole.id, data);
      toast.success('Permission added successfully');
      // Refresh permissions
      await fetchRolePermissions(selectedRole.id);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add permission');
    }
  };

  const handleDeletePermission = async (permissionId: string) => {
    if (!selectedRole) return;
    if (!confirm('Are you sure you want to remove this permission?')) return;
    try {
      await deleteRolePermission(selectedRole.id, permissionId);
      toast.success('Permission removed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to remove permission');
    }
  };

  const handleFilterAudits = async () => {
    try {
      const params: any = {};
      if (auditFilters.entityType) params.entityType = auditFilters.entityType;
      if (auditFilters.entityId) params.entityId = auditFilters.entityId;
      if (auditFilters.limit) params.limit = auditFilters.limit;
      await fetchAudits(params);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch audit logs');
    }
  };

  // Render department tree
  const renderDepartmentTree = (parentId: string | null = null, level: number = 0) => {
    const filteredDepts = departments.filter((d) => d.parentId === parentId);

    return filteredDepts.map((dept) => (
      <div key={dept.id} style={{ marginLeft: `${level * 24}px` }}>
        <div className="bg-card border border-border rounded-lg p-4 mb-2 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold text-foreground">{dept.name}</h3>
                <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 rounded-full">
                  {dept._count?.userDepartments || 0} users
                </span>
              </div>
              {dept.description && (
                <p className="text-sm text-muted-foreground mt-2 ml-7">{dept.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setSelectedDepartment(dept);
                  setShowAddUserModal(true);
                }}
                className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                title="Add User"
              >
                <UserPlus className="h-4 w-4" />
              </button>
              <button
                onClick={() => handleDeleteDepartment(dept.id)}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete Department"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
        {renderDepartmentTree(dept.id, level + 1)}
      </div>
    ));
  };

  if (isLoading && departments.length === 0 && roles.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">RBAC Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage departments, roles, and permissions for your organization
          </p>
        </div>
        <div className="flex gap-2">
          {selectedTab === 'departments' && (
            <button
              onClick={() => setShowCreateDepartmentModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Department
            </button>
          )}
          {selectedTab === 'roles' && (
            <button
              onClick={() => setShowCreateRoleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Role
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex gap-4">
          {[
            { id: 'departments', label: 'Departments', icon: Users },
            { id: 'roles', label: 'Roles', icon: Shield },
            { id: 'audit', label: 'Audit Log', icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as TabType)}
              className={`flex items-center gap-2 pb-4 px-2 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Departments Tab */}
      {selectedTab === 'departments' && (
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-4">Department Hierarchy</h3>
            {departments.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No departments</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Get started by creating your first department.
                </p>
              </div>
            ) : (
              <div className="space-y-2">{renderDepartmentTree()}</div>
            )}
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {selectedTab === 'roles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold text-foreground">{role.name}</h3>
                    <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">
                      Level {role.level}
                    </span>
                  </div>
                  {role.isSystem && (
                    <span className="inline-block mt-1 px-2 py-1 text-xs font-medium bg-yellow-500/10 text-yellow-600 rounded-full">
                      System Role
                    </span>
                  )}
                  {role.description && (
                    <p className="text-sm text-muted-foreground mt-2">{role.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                <Key className="h-4 w-4" />
                <span>{role._count?.rolePermissions || 0} permissions</span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleViewPermissions(role)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Eye className="h-4 w-4" />
                  View Permissions
                </button>
                <button
                  onClick={() => handleDeleteRole(role.id, role.isSystem)}
                  disabled={role.isSystem}
                  className={`px-3 py-2 text-sm border border-border rounded-lg transition-colors ${
                    role.isSystem
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500'
                  }`}
                  title={role.isSystem ? 'Cannot delete system role' : 'Delete role'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {roles.length === 0 && (
            <div className="col-span-full text-center py-12 bg-card border border-border rounded-lg">
              <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No roles</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get started by creating your first custom role.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Audit Log Tab */}
      {selectedTab === 'audit' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-foreground mb-4">Filters</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Entity Type
                </label>
                <select
                  value={auditFilters.entityType}
                  onChange={(e) =>
                    setAuditFilters({ ...auditFilters, entityType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="">All</option>
                  <option value="user">User</option>
                  <option value="role">Role</option>
                  <option value="department">Department</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Entity ID
                </label>
                <input
                  type="text"
                  value={auditFilters.entityId}
                  onChange={(e) =>
                    setAuditFilters({ ...auditFilters, entityId: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  placeholder="Optional"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Limit</label>
                <input
                  type="number"
                  value={auditFilters.limit}
                  onChange={(e) =>
                    setAuditFilters({ ...auditFilters, limit: parseInt(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  min="1"
                  max="500"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleFilterAudits}
                  className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>

          {/* Audit Table */}
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Entity Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Action
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Resource
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Permission
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Reason
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {audits.map((audit) => (
                    <tr key={audit.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(audit.timestamp).toLocaleString()}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-600 rounded-full">
                          {audit.entityType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            audit.action === 'grant'
                              ? 'bg-green-500/10 text-green-600'
                              : audit.action === 'revoke'
                              ? 'bg-red-500/10 text-red-600'
                              : 'bg-yellow-500/10 text-yellow-600'
                          }`}
                        >
                          {audit.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">{audit.resource}</td>
                      <td className="px-4 py-3 text-sm text-foreground">{audit.permission}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {audit.reason || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {audits.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-medium text-foreground">No audit logs</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Permission changes will appear here.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateDepartmentModal && (
        <CreateDepartmentModal
          onClose={() => setShowCreateDepartmentModal(false)}
          onCreate={handleCreateDepartment}
          departments={departments}
        />
      )}

      {showAddUserModal && selectedDepartment && (
        <AddUserToDepartmentModal
          department={selectedDepartment}
          onClose={() => {
            setShowAddUserModal(false);
            setSelectedDepartment(null);
          }}
          onAdd={handleAddUserToDepartment}
        />
      )}

      {showCreateRoleModal && (
        <CreateRoleModal
          onClose={() => setShowCreateRoleModal(false)}
          onCreate={handleCreateRole}
        />
      )}

      {showViewPermissionsModal && selectedRole && (
        <ViewRolePermissionsModal
          role={selectedRole}
          permissions={rolePermissions}
          onClose={() => {
            setShowViewPermissionsModal(false);
            selectRole(null);
          }}
          onAddPermission={() => setShowAddPermissionModal(true)}
          onDeletePermission={handleDeletePermission}
        />
      )}

      {showAddPermissionModal && selectedRole && (
        <AddPermissionToRoleModal
          onClose={() => setShowAddPermissionModal(false)}
          onAdd={handleAddPermission}
        />
      )}
    </div>
  );
}

// Create Department Modal
function CreateDepartmentModal({
  onClose,
  onCreate,
  departments,
}: {
  onClose: () => void;
  onCreate: (data: CreateDepartment) => void;
  departments: Department[];
}) {
  const [formData, setFormData] = useState<CreateDepartment>({
    name: '',
    description: '',
    parentId: undefined,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Department name is required');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">Create Department</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Department Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="e.g., Engineering"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Parent Department
            </label>
            <select
              value={formData.parentId || ''}
              onChange={(e) =>
                setFormData({ ...formData, parentId: e.target.value || undefined })
              }
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">None (Top Level)</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Add User to Department Modal
function AddUserToDepartmentModal({
  department,
  onClose,
  onAdd,
}: {
  department: Department;
  onClose: () => void;
  onAdd: (data: { userId: string; isPrimary?: boolean }) => void;
}) {
  const [userId, setUserId] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      toast.error('User ID is required');
      return;
    }
    onAdd({ userId, isPrimary });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Add User to {department.name}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">User ID *</label>
            <input
              type="text"
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="Enter user ID"
            />
          </div>

          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="rounded border-border"
              />
              <span className="text-sm font-medium text-foreground">
                Set as primary department
              </span>
            </label>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add User
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Role Modal
function CreateRoleModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (data: CreateCustomRole) => void;
}) {
  const [formData, setFormData] = useState<CreateCustomRole>({
    name: '',
    description: '',
    level: 0,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Role name is required');
      return;
    }
    onCreate(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">Create Custom Role</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Role Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              placeholder="e.g., Senior Developer"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              rows={3}
              placeholder="Optional description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Level</label>
            <input
              type="number"
              value={formData.level}
              onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
              min="0"
              max="100"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Higher levels have more authority (0-100)
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Create
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Role Permissions Modal
function ViewRolePermissionsModal({
  role,
  permissions,
  onClose,
  onAddPermission,
  onDeletePermission,
}: {
  role: CustomRole;
  permissions: any[];
  onClose: () => void;
  onAddPermission: () => void;
  onDeletePermission: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-foreground">
            Permissions for {role.name}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={onAddPermission}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Permission
          </button>
        </div>

        <div className="space-y-2">
          {permissions.map((perm) => (
            <div
              key={perm.id}
              className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">{perm.resource}</span>
                  <span className="text-muted-foreground">:</span>
                  <span className="text-primary">{perm.action}</span>
                </div>
                {perm.conditions && Object.keys(perm.conditions).length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Conditions: {JSON.stringify(perm.conditions)}
                  </p>
                )}
              </div>
              <button
                onClick={() => onDeletePermission(perm.id)}
                className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          {permissions.length === 0 && (
            <div className="text-center py-12">
              <Key className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-medium text-foreground">No permissions</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Add permissions to this role to grant access.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Add Permission to Role Modal
function AddPermissionToRoleModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (data: CreateRolePermission) => void;
}) {
  const [formData, setFormData] = useState<CreateRolePermission>({
    resource: '',
    action: '',
    conditions: {},
  });

  const resources = [
    'contact',
    'deal',
    'conversation',
    'zettel',
    'workflow',
    'user',
    'department',
    'role',
    'permission',
    'analytics',
    'settings',
  ];

  const actions = ['create', 'read', 'update', 'delete', 'manage'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resource || !formData.action) {
      toast.error('Resource and action are required');
      return;
    }
    onAdd(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-card rounded-lg p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold text-foreground mb-4">Add Permission</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Resource *</label>
            <select
              required
              value={formData.resource}
              onChange={(e) => setFormData({ ...formData, resource: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">Select resource...</option>
              {resources.map((resource) => (
                <option key={resource} value={resource}>
                  {resource}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Action *</label>
            <select
              required
              value={formData.action}
              onChange={(e) => setFormData({ ...formData, action: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
            >
              <option value="">Select action...</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Add
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-accent transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
