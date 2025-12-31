// src/modules/rbac/permission.service.ts
import { PrismaClient } from '@prisma/client';
import { logger } from '../../core/logger';

/**
 * Serviço de Permissões Dinâmicas e Hierárquicas
 *
 * Hierarquia de Acesso:
 * 1. DEV - Acesso total ao sistema
 * 2. admin - Pode gerenciar empresas (acesso global)
 * 3. admin_empresa - Pode gerenciar SUA empresa, criar departamentos, cargos, definir permissões
 * 4. cliente - Permissões customizadas definidas pelo admin_empresa
 *
 * Ordem de verificação:
 * 1. Role do sistema (DEV, admin, admin_empresa)
 * 2. Permissões específicas do usuário (UserPermission - override)
 * 3. Permissões do cargo customizado (CustomRole + RolePermission)
 * 4. Permissões do departamento (DepartmentPermission)
 */
export class PermissionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Verifica se usuário tem permissão para realizar uma ação
   */
  async hasPermission(
    userId: string,
    resource: string,
    action: string,
    context?: {
      companyId?: string;
      departmentId?: string;
      resourceOwnerId?: string;
    }
  ): Promise<boolean> {
    try {
      // 1. Buscar informações do usuário
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          userDepartments: {
            where: { department: { isActive: true } },
            include: { department: true },
          },
          userPermissions: {
            where: {
              OR: [
                { expiresAt: null },
                { expiresAt: { gt: new Date() } },
              ],
            },
          },
        },
      });

      if (!user || !user.active) {
        return false;
      }

      // 2. DEV tem acesso total
      if (user.role === 'DEV') {
        logger.info({ userId, resource, action }, 'Permission granted: DEV role');
        return true;
      }

      // 3. Admin (global) pode gerenciar empresas
      if (user.role === 'admin') {
        // Admin global pode fazer qualquer coisa relacionado a gerenciamento de empresas
        const adminResources = ['company', 'user', 'settings', 'integration', 'audit'];
        if (adminResources.includes(resource)) {
          logger.info({ userId, resource, action }, 'Permission granted: admin role');
          return true;
        }
      }

      // 4. Admin_empresa pode gerenciar sua empresa
      if (user.role === 'admin_empresa') {
        // Verificar se é da mesma empresa
        if (context?.companyId && context.companyId !== user.companyId) {
          logger.warn({
            userId,
            userCompanyId: user.companyId,
            requestedCompanyId: context.companyId,
          }, 'Permission denied: admin_empresa from different company');
          return false;
        }

        // Admin_empresa pode fazer qualquer coisa na própria empresa
        const adminEmpresaResources = [
          'user',
          'department',
          'role',
          'permission',
          'contact',
          'deal',
          'product',
          'invoice',
          'knowledge',
          'chat',
          'settings',
          'integration',
          'workflow',
          'analytics',
          'file',
        ];

        if (adminEmpresaResources.includes(resource)) {
          logger.info({
            userId,
            resource,
            action,
            companyId: user.companyId,
          }, 'Permission granted: admin_empresa role');
          return true;
        }
      }

      // 5. Verificar permissões específicas do usuário (override)
      const userPermission = user.userPermissions.find(
        (p) => p.resource === resource && p.action === action
      );

      if (userPermission) {
        // Se tem permissão específica, respeitar o valor (granted true/false)
        if (userPermission.granted) {
          logger.info({
            userId,
            resource,
            action,
          }, 'Permission granted: user-specific permission');
          return true;
        } else {
          logger.info({
            userId,
            resource,
            action,
          }, 'Permission denied: user-specific revocation');
          return false;
        }
      }

      // 6. Verificar permissões do cargo customizado
      if (user.customRoleId) {
        const hasRolePermission = await this.checkCustomRolePermission(
          user.customRoleId,
          resource,
          action,
          context
        );

        if (hasRolePermission) {
          logger.info({
            userId,
            customRoleId: user.customRoleId,
            resource,
            action,
          }, 'Permission granted: custom role permission');
          return true;
        }
      }

      // 7. Verificar permissões do departamento
      if (context?.departmentId || user.userDepartments.length > 0) {
        const departmentId =
          context?.departmentId ||
          user.userDepartments.find((ud) => ud.isPrimary)?.departmentId ||
          user.userDepartments[0]?.departmentId;

        if (departmentId && user.customRoleId) {
          const hasDepartmentPermission = await this.checkDepartmentPermission(
            departmentId,
            user.customRoleId,
            resource,
            action,
            context
          );

          if (hasDepartmentPermission) {
            logger.info({
              userId,
              departmentId,
              resource,
              action,
            }, 'Permission granted: department permission');
            return true;
          }
        }
      }

      // 8. Permissão negada
      logger.warn({
        userId,
        role: user.role,
        customRoleId: user.customRoleId,
        resource,
        action,
      }, 'Permission denied: no matching permission found');

      return false;
    } catch (error) {
      logger.error({ error, userId, resource, action }, 'Error checking permission');
      return false; // Em caso de erro, negar permissão (fail-safe)
    }
  }

  /**
   * Verifica permissão do cargo customizado
   */
  private async checkCustomRolePermission(
    roleId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    const permission = await this.prisma.rolePermission.findFirst({
      where: {
        roleId,
        resource,
        action,
      },
    });

    if (!permission) {
      return false;
    }

    // Verificar condições (se existirem)
    if (permission.conditions && Object.keys(permission.conditions).length > 0) {
      return this.evaluateConditions(permission.conditions as any, context);
    }

    return true;
  }

  /**
   * Verifica permissão do departamento
   */
  private async checkDepartmentPermission(
    departmentId: string,
    roleId: string,
    resource: string,
    action: string,
    context?: any
  ): Promise<boolean> {
    const permission = await this.prisma.departmentPermission.findFirst({
      where: {
        departmentId,
        roleId,
        resource,
        action,
      },
    });

    if (!permission) {
      return false;
    }

    // Verificar condições (se existirem)
    if (permission.conditions && Object.keys(permission.conditions).length > 0) {
      return this.evaluateConditions(permission.conditions as any, context);
    }

    return true;
  }

  /**
   * Avalia condições de permissão
   * Exemplo: { "onlyOwn": true } - usuário só pode acessar seus próprios recursos
   */
  private evaluateConditions(conditions: any, context?: any): boolean {
    // Condição: só pode acessar seus próprios recursos
    if (conditions.onlyOwn === true) {
      if (!context?.resourceOwnerId || !context?.userId) {
        return false;
      }
      return context.resourceOwnerId === context.userId;
    }

    // Condição: apenas dentro do próprio departamento
    if (conditions.onlyDepartment === true) {
      if (!context?.resourceDepartmentId || !context?.departmentId) {
        return false;
      }
      return context.resourceDepartmentId === context.departmentId;
    }

    // Condição: apenas para recursos ativos
    if (conditions.onlyActive === true) {
      if (context?.resourceStatus) {
        return context.resourceStatus === 'active';
      }
    }

    // Se não tem condições especiais ou não foram implementadas, permitir
    return true;
  }

  /**
   * Obtém todas as permissões de um usuário
   */
  async getUserPermissions(userId: string): Promise<{
    role: string;
    customRole?: { id: string; name: string; level: number };
    departments: Array<{ id: string; name: string; isPrimary: boolean }>;
    permissions: Array<{ resource: string; action: string; source: string }>;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userDepartments: {
          include: { department: true },
          where: { department: { isActive: true } },
        },
        userPermissions: {
          where: {
            granted: true,
            OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
          },
        },
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const permissions: Array<{ resource: string; action: string; source: string }> = [];

    // 1. Permissões específicas do usuário
    user.userPermissions.forEach((p) => {
      permissions.push({
        resource: p.resource,
        action: p.action,
        source: 'user-specific',
      });
    });

    // 2. Permissões do cargo customizado
    if (user.customRoleId) {
      const rolePermissions = await this.prisma.rolePermission.findMany({
        where: { roleId: user.customRoleId },
      });

      rolePermissions.forEach((p) => {
        permissions.push({
          resource: p.resource,
          action: p.action,
          source: 'custom-role',
        });
      });

      // 3. Permissões dos departamentos
      for (const ud of user.userDepartments) {
        const deptPermissions = await this.prisma.departmentPermission.findMany({
          where: {
            departmentId: ud.departmentId,
            roleId: user.customRoleId,
          },
        });

        deptPermissions.forEach((p) => {
          permissions.push({
            resource: p.resource,
            action: p.action,
            source: `department-${ud.department.name}`,
          });
        });
      }
    }

    // Obter informações do cargo customizado
    let customRole;
    if (user.customRoleId) {
      const role = await this.prisma.customRole.findUnique({
        where: { id: user.customRoleId },
      });
      if (role) {
        customRole = {
          id: role.id,
          name: role.name,
          level: role.level,
        };
      }
    }

    return {
      role: user.role,
      customRole,
      departments: user.userDepartments.map((ud) => ({
        id: ud.department.id,
        name: ud.department.name,
        isPrimary: ud.isPrimary,
      })),
      permissions: this.deduplicatePermissions(permissions),
    };
  }

  /**
   * Remove permissões duplicadas
   */
  private deduplicatePermissions(
    permissions: Array<{ resource: string; action: string; source: string }>
  ): Array<{ resource: string; action: string; source: string }> {
    const seen = new Set<string>();
    const result: Array<{ resource: string; action: string; source: string }> = [];

    for (const perm of permissions) {
      const key = `${perm.resource}:${perm.action}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(perm);
      }
    }

    return result;
  }

  /**
   * Registra mudança de permissão na auditoria
   */
  async auditPermissionChange(data: {
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
  }): Promise<void> {
    await this.prisma.permissionAudit.create({
      data: {
        companyId: data.companyId,
        entityType: data.entityType,
        entityId: data.entityId,
        action: data.action,
        resource: data.resource,
        permission: data.permission,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        changedBy: data.changedBy,
        reason: data.reason,
      },
    });

    logger.info(data, 'Permission change audited');
  }
}
