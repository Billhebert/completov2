// src/modules/rbac/index.ts
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../core/middleware/auth';
import { tenantIsolation } from '../../core/middleware/tenant';
import { companyAdminOnly, requireSystemRole } from './middleware';
import { PermissionService } from './permission.service';

const prisma = new PrismaClient();
const permissionService = new PermissionService(prisma);

/**
 * Rotas de gerenciamento RBAC
 *
 * Hierarquia de acesso:
 * - DEV: Acesso total
 * - admin: Gerenciamento de empresas
 * - admin_empresa: Gerenciamento completo da própria empresa
 * - cliente: Acesso conforme definido pelo admin_empresa
 */
export default function registerRBACRoutes(app: Express) {
  const base = '/api/v1/rbac';

  // =============================================
  // DEPARTAMENTOS
  // =============================================

  // Listar departamentos da empresa
  app.get(
    `${base}/departments`,
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        const departments = await prisma.department.findMany({
          where: {
            companyId: req.companyId!,
            isActive: true,
          },
          include: {
            parent: true,
            children: true,
            _count: {
              select: {
                userDepartments: true,
                departmentPermissions: true,
              },
            },
          },
          orderBy: { name: 'asc' },
        });

        res.json({ success: true, data: departments });
      } catch (error) {
        next(error);
      }
    }
  );

  // Criar departamento
  app.post(
    `${base}/departments`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { name, description, parentId, metadata } = req.body;

        // Se tem parentId, verificar se existe e é da mesma empresa
        if (parentId) {
          const parent = await prisma.department.findFirst({
            where: {
              id: parentId,
              companyId: req.companyId!,
            },
          });

          if (!parent) {
            return res.status(404).json({
              success: false,
              error: { message: 'Parent department not found' },
            });
          }
        }

        const department = await prisma.department.create({
          data: {
            companyId: req.companyId!,
            name,
            description,
            parentId: parentId || null,
            metadata: metadata || {},
            createdBy: req.user!.id,
          },
          include: {
            parent: true,
            children: true,
          },
        });

        await permissionService.auditPermissionChange({
          companyId: req.companyId!,
          entityType: 'department',
          entityId: department.id,
          action: 'grant',
          resource: 'department',
          permission: 'create',
          newValue: { name, parentId },
          changedBy: req.user!.id,
          reason: 'Department created',
        });

        res.json({ success: true, data: department });
      } catch (error) {
        next(error);
      }
    }
  );

  // Atualizar departamento
  app.put(
    `${base}/departments/:id`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { id } = req.params;
        const { name, description, parentId, isActive, metadata } = req.body;

        const existing = await prisma.department.findFirst({
          where: {
            id,
            companyId: req.companyId!,
          },
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            error: { message: 'Department not found' },
          });
        }

        const updated = await prisma.department.update({
          where: { id },
          data: {
            name: name || existing.name,
            description,
            parentId,
            isActive,
            metadata,
          },
          include: {
            parent: true,
            children: true,
          },
        });

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  // Deletar departamento
  app.delete(
    `${base}/departments/:id`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { id } = req.params;

        const existing = await prisma.department.findFirst({
          where: {
            id,
            companyId: req.companyId!,
          },
          include: {
            children: true,
            userDepartments: true,
          },
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            error: { message: 'Department not found' },
          });
        }

        // Verificar se tem subdepartamentos
        if (existing.children.length > 0) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Cannot delete department with subdepartments',
              subdepartments: existing.children.length,
            },
          });
        }

        // Verificar se tem usuários
        if (existing.userDepartments.length > 0) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Cannot delete department with users',
              users: existing.userDepartments.length,
            },
          });
        }

        await prisma.department.delete({ where: { id } });

        res.json({ success: true, message: 'Department deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // Adicionar usuário ao departamento
  app.post(
    `${base}/departments/:id/users`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { id: departmentId } = req.params;
        const { userId, isPrimary } = req.body;

        // Verificar se departamento existe e é da empresa
        const department = await prisma.department.findFirst({
          where: {
            id: departmentId,
            companyId: req.companyId!,
          },
        });

        if (!department) {
          return res.status(404).json({
            success: false,
            error: { message: 'Department not found' },
          });
        }

        // Verificar se usuário existe e é da empresa
        const user = await prisma.user.findFirst({
          where: {
            id: userId,
            companyId: req.companyId!,
          },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            error: { message: 'User not found' },
          });
        }

        // Se isPrimary, remover isPrimary de outros departamentos do usuário
        if (isPrimary) {
          await prisma.userDepartment.updateMany({
            where: { userId },
            data: { isPrimary: false },
          });
        }

        // Adicionar usuário ao departamento
        const userDept = await prisma.userDepartment.create({
          data: {
            userId,
            departmentId,
            isPrimary: isPrimary || false,
            assignedBy: req.user!.id,
          },
          include: {
            department: true,
          },
        });

        res.json({ success: true, data: userDept });
      } catch (error) {
        next(error);
      }
    }
  );

  // =============================================
  // CARGOS CUSTOMIZADOS (CUSTOM ROLES)
  // =============================================

  // Listar cargos customizados
  app.get(
    `${base}/roles`,
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        const roles = await prisma.customRole.findMany({
          where: {
            companyId: req.companyId!,
            isActive: true,
          },
          include: {
            _count: {
              select: {
                rolePermissions: true,
                departmentPermissions: true,
              },
            },
          },
          orderBy: [{ level: 'desc' }, { name: 'asc' }],
        });

        res.json({ success: true, data: roles });
      } catch (error) {
        next(error);
      }
    }
  );

  // Criar cargo customizado
  app.post(
    `${base}/roles`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { name, description, level, metadata } = req.body;

        const role = await prisma.customRole.create({
          data: {
            companyId: req.companyId!,
            name,
            description,
            level: level || 0,
            metadata: metadata || {},
            createdBy: req.user!.id,
          },
        });

        await permissionService.auditPermissionChange({
          companyId: req.companyId!,
          entityType: 'role',
          entityId: role.id,
          action: 'grant',
          resource: 'role',
          permission: 'create',
          newValue: { name, level },
          changedBy: req.user!.id,
        });

        res.json({ success: true, data: role });
      } catch (error) {
        next(error);
      }
    }
  );

  // Atualizar cargo
  app.put(
    `${base}/roles/:id`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { id } = req.params;
        const { name, description, level, isActive, metadata } = req.body;

        const existing = await prisma.customRole.findFirst({
          where: {
            id,
            companyId: req.companyId!,
          },
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            error: { message: 'Role not found' },
          });
        }

        if (existing.isSystem) {
          return res.status(400).json({
            success: false,
            error: { message: 'Cannot modify system role' },
          });
        }

        const updated = await prisma.customRole.update({
          where: { id },
          data: { name, description, level, isActive, metadata },
        });

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  // Deletar cargo
  app.delete(
    `${base}/roles/:id`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { id } = req.params;

        const existing = await prisma.customRole.findFirst({
          where: {
            id,
            companyId: req.companyId!,
          },
        });

        if (!existing) {
          return res.status(404).json({
            success: false,
            error: { message: 'Role not found' },
          });
        }

        if (existing.isSystem) {
          return res.status(400).json({
            success: false,
            error: { message: 'Cannot delete system role' },
          });
        }

        // Verificar se há usuários com esse cargo
        const usersCount = await prisma.user.count({
          where: { customRoleId: id },
        });

        if (usersCount > 0) {
          return res.status(400).json({
            success: false,
            error: {
              message: 'Cannot delete role assigned to users',
              users: usersCount,
            },
          });
        }

        await prisma.customRole.delete({ where: { id } });

        res.json({ success: true, message: 'Role deleted' });
      } catch (error) {
        next(error);
      }
    }
  );

  // =============================================
  // PERMISSÕES DE CARGOS
  // =============================================

  // Listar permissões de um cargo
  app.get(
    `${base}/roles/:id/permissions`,
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        const { id } = req.params;

        const permissions = await prisma.rolePermission.findMany({
          where: { roleId: id },
          orderBy: [{ resource: 'asc' }, { action: 'asc' }],
        });

        res.json({ success: true, data: permissions });
      } catch (error) {
        next(error);
      }
    }
  );

  // Adicionar permissão a um cargo
  app.post(
    `${base}/roles/:id/permissions`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { id: roleId } = req.params;
        const { resource, action, conditions } = req.body;

        // Verificar se cargo existe
        const role = await prisma.customRole.findFirst({
          where: {
            id: roleId,
            companyId: req.companyId!,
          },
        });

        if (!role) {
          return res.status(404).json({
            success: false,
            error: { message: 'Role not found' },
          });
        }

        const permission = await prisma.rolePermission.create({
          data: {
            roleId,
            resource,
            action,
            conditions: conditions || {},
          },
        });

        await permissionService.auditPermissionChange({
          companyId: req.companyId!,
          entityType: 'role',
          entityId: roleId,
          action: 'grant',
          resource,
          permission: action,
          newValue: { conditions },
          changedBy: req.user!.id,
        });

        res.json({ success: true, data: permission });
      } catch (error) {
        next(error);
      }
    }
  );

  // Remover permissão de um cargo
  app.delete(
    `${base}/roles/:roleId/permissions/:permId`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { roleId, permId } = req.params;

        const permission = await prisma.rolePermission.findUnique({
          where: { id: permId },
          include: { role: true },
        });

        if (!permission || permission.role.companyId !== req.companyId) {
          return res.status(404).json({
            success: false,
            error: { message: 'Permission not found' },
          });
        }

        await prisma.rolePermission.delete({ where: { id: permId } });

        await permissionService.auditPermissionChange({
          companyId: req.companyId!,
          entityType: 'role',
          entityId: roleId,
          action: 'revoke',
          resource: permission.resource,
          permission: permission.action,
          changedBy: req.user!.id,
        });

        res.json({ success: true, message: 'Permission removed' });
      } catch (error) {
        next(error);
      }
    }
  );

  // =============================================
  // PERMISSÕES DE USUÁRIO (OVERRIDE)
  // =============================================

  // Listar permissões específicas de um usuário
  app.get(
    `${base}/users/:userId/permissions`,
    authenticate,
    tenantIsolation,
    async (req, res, next) => {
      try {
        const { userId } = req.params;

        // Verificar se usuário é da mesma empresa
        const user = await prisma.user.findFirst({
          where: {
            id: userId,
            companyId: req.companyId!,
          },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            error: { message: 'User not found' },
          });
        }

        const permissions = await permissionService.getUserPermissions(userId);

        res.json({ success: true, data: permissions });
      } catch (error) {
        next(error);
      }
    }
  );

  // Conceder/Revogar permissão específica para usuário
  app.post(
    `${base}/users/:userId/permissions`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { userId } = req.params;
        const { resource, action, granted, conditions, reason, expiresAt } = req.body;

        // Verificar se usuário é da mesma empresa
        const user = await prisma.user.findFirst({
          where: {
            id: userId,
            companyId: req.companyId!,
          },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            error: { message: 'User not found' },
          });
        }

        const permission = await prisma.userPermission.upsert({
          where: {
            userId_resource_action: {
              userId,
              resource,
              action,
            },
          },
          create: {
            userId,
            resource,
            action,
            granted: granted !== false,
            conditions: conditions || {},
            reason,
            grantedBy: req.user!.id,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
          update: {
            granted: granted !== false,
            conditions: conditions || {},
            reason,
            grantedBy: req.user!.id,
            expiresAt: expiresAt ? new Date(expiresAt) : null,
          },
        });

        await permissionService.auditPermissionChange({
          companyId: req.companyId!,
          entityType: 'user',
          entityId: userId,
          action: granted !== false ? 'grant' : 'revoke',
          resource,
          permission: action,
          newValue: { conditions, reason, expiresAt },
          changedBy: req.user!.id,
        });

        res.json({ success: true, data: permission });
      } catch (error) {
        next(error);
      }
    }
  );

  // Atribuir cargo customizado a um usuário
  app.put(
    `${base}/users/:userId/role`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { userId } = req.params;
        const { customRoleId } = req.body;

        // Verificar se usuário é da mesma empresa
        const user = await prisma.user.findFirst({
          where: {
            id: userId,
            companyId: req.companyId!,
          },
        });

        if (!user) {
          return res.status(404).json({
            success: false,
            error: { message: 'User not found' },
          });
        }

        // Se tem customRoleId, verificar se existe e é da mesma empresa
        if (customRoleId) {
          const role = await prisma.customRole.findFirst({
            where: {
              id: customRoleId,
              companyId: req.companyId!,
            },
          });

          if (!role) {
            return res.status(404).json({
              success: false,
              error: { message: 'Role not found' },
            });
          }
        }

        const updated = await prisma.user.update({
          where: { id: userId },
          data: { customRoleId: customRoleId || null },
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            customRoleId: true,
          },
        });

        res.json({ success: true, data: updated });
      } catch (error) {
        next(error);
      }
    }
  );

  // =============================================
  // AUDITORIA
  // =============================================

  // Histórico de mudanças de permissões
  app.get(
    `${base}/audit`,
    authenticate,
    tenantIsolation,
    companyAdminOnly,
    async (req, res, next) => {
      try {
        const { entityType, entityId, limit = 100 } = req.query;

        const where: any = {
          companyId: req.companyId!,
        };

        if (entityType) {
          where.entityType = entityType;
        }

        if (entityId) {
          where.entityId = entityId;
        }

        const audits = await prisma.permissionAudit.findMany({
          where,
          orderBy: { timestamp: 'desc' },
          take: parseInt(limit as string),
        });

        res.json({ success: true, data: audits });
      } catch (error) {
        next(error);
      }
    }
  );
}

// Module export
import { ModuleDefinition } from '../../core/types';

export const rbacModule: ModuleDefinition = {
  name: 'rbac',
  version: '1.0.0',
  provides: ['rbac', 'permissions', 'departments', 'roles'],
  routes: (ctx) => registerRBACRoutes(ctx.app),
};
