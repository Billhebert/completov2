// src/modules/rbac/middleware.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../../core/errors';
import { PermissionService } from './permission.service';

const prisma = new PrismaClient();
const permissionService = new PermissionService(prisma);

/**
 * Middleware para verificar permissão dinâmica
 * Usa o sistema de permissões flexível (departamentos, cargos customizados, etc)
 */
export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      const context = {
        companyId: req.companyId,
        userId: req.user.id,
        departmentId: req.headers['x-department-id'] as string | undefined,
        resourceOwnerId: req.params.userId || req.query.userId as string | undefined,
      };

      const hasPermission = await permissionService.hasPermission(
        req.user.id,
        resource,
        action,
        context
      );

      if (!hasPermission) {
        return next(
          new ForbiddenError(
            `Permission denied: ${action} on ${resource}`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar se usuário tem qualquer uma das permissões
 */
export function requireAnyPermission(
  permissions: Array<{ resource: string; action: string }>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      const context = {
        companyId: req.companyId,
        userId: req.user.id,
        departmentId: req.headers['x-department-id'] as string | undefined,
      };

      const checks = await Promise.all(
        permissions.map((perm) =>
          permissionService.hasPermission(
            req.user!.id,
            perm.resource,
            perm.action,
            context
          )
        )
      );

      const hasAny = checks.some((result) => result === true);

      if (!hasAny) {
        const permStrings = permissions.map((p) => `${p.action} on ${p.resource}`);
        return next(
          new ForbiddenError(
            `Permission denied: requires one of [${permStrings.join(', ')}]`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar se usuário tem todas as permissões
 */
export function requireAllPermissions(
  permissions: Array<{ resource: string; action: string }>
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      const context = {
        companyId: req.companyId,
        userId: req.user.id,
        departmentId: req.headers['x-department-id'] as string | undefined,
      };

      const checks = await Promise.all(
        permissions.map((perm) =>
          permissionService.hasPermission(
            req.user!.id,
            perm.resource,
            perm.action,
            context
          )
        )
      );

      const hasAll = checks.every((result) => result === true);

      if (!hasAll) {
        const permStrings = permissions.map((p) => `${p.action} on ${p.resource}`);
        return next(
          new ForbiddenError(
            `Permission denied: requires all of [${permStrings.join(', ')}]`
          )
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware para verificar role do sistema (DEV, admin, admin_empresa, cliente)
 */
export function requireSystemRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied: requires role ${roles.join(' or ')}`
        )
      );
    }

    next();
  };
}

/**
 * Middleware exclusivo para DEV
 */
export function devOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (req.user.role !== 'DEV') {
    return next(new ForbiddenError('DEV access required'));
  }

  next();
}

/**
 * Middleware exclusivo para admin (global)
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (req.user.role !== 'admin' && req.user.role !== 'DEV') {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
}

/**
 * Middleware exclusivo para admin_empresa (ou superior)
 */
export function companyAdminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  const allowedRoles = ['DEV', 'admin', 'admin_empresa'];
  if (!allowedRoles.includes(req.user.role)) {
    return next(new ForbiddenError('Company admin access required'));
  }

  next();
}

/**
 * Middleware para verificar se usuário está acessando recurso da própria empresa
 */
export function sameCompanyOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  // DEV e admin global podem acessar qualquer empresa
  if (req.user.role === 'DEV' || req.user.role === 'admin') {
    return next();
  }

  const requestedCompanyId = req.params.companyId || req.body.companyId || req.query.companyId;

  if (requestedCompanyId && requestedCompanyId !== req.user.companyId) {
    return next(
      new ForbiddenError('Cannot access resources from other companies')
    );
  }

  next();
}

export { permissionService };
