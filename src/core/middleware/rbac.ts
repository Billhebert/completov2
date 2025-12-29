// src/core/middleware/rbac.ts
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../errors';
import { Permission } from '../types';

// Role-based permissions matrix
const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(Permission), // Admin has all permissions
  
  manager: [
    // Users
    Permission.USER_READ,
    Permission.USER_UPDATE,
    
    // Chat
    Permission.CHAT_CREATE,
    Permission.CHAT_READ,
    Permission.CHAT_UPDATE,
    Permission.CHAT_DELETE,
    
    // CRM
    Permission.CONTACT_CREATE,
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,
    Permission.CONTACT_DELETE,
    Permission.DEAL_CREATE,
    Permission.DEAL_READ,
    Permission.DEAL_UPDATE,
    Permission.DEAL_DELETE,
    
    // ERP
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_READ,
    Permission.PRODUCT_UPDATE,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_UPDATE,
    
    // Knowledge
    Permission.KNOWLEDGE_CREATE,
    Permission.KNOWLEDGE_READ,
    Permission.KNOWLEDGE_UPDATE,
    Permission.KNOWLEDGE_DELETE,
  ],
  
  agent: [
    // Users
    Permission.USER_READ,
    
    // Chat
    Permission.CHAT_CREATE,
    Permission.CHAT_READ,
    Permission.CHAT_UPDATE,
    
    // CRM
    Permission.CONTACT_READ,
    Permission.CONTACT_UPDATE,
    Permission.DEAL_READ,
    Permission.DEAL_UPDATE,
    
    // ERP
    Permission.PRODUCT_READ,
    Permission.INVOICE_READ,
    
    // Knowledge
    Permission.KNOWLEDGE_READ,
  ],
  
  viewer: [
    Permission.USER_READ,
    Permission.CHAT_READ,
    Permission.CONTACT_READ,
    Permission.DEAL_READ,
    Permission.PRODUCT_READ,
    Permission.INVOICE_READ,
    Permission.KNOWLEDGE_READ,
  ],
};

/**
 * Check if user has required permission
 */
export function hasPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasAllPermissions = permissions.every(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(
        new ForbiddenError(
          `Required permissions: ${permissions.join(', ')}`
        )
      );
    }

    next();
  };
}

/**
 * Check if user has any of the required permissions
 */
export function hasAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    const userRole = req.user.role;
    const userPermissions = ROLE_PERMISSIONS[userRole] || [];

    const hasAny = permissions.some(permission =>
      userPermissions.includes(permission)
    );

    if (!hasAny) {
      return next(
        new ForbiddenError(
          `Required one of: ${permissions.join(', ')}`
        )
      );
    }

    next();
  };
}

/**
 * Check if user has specific role
 */
export function hasRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new ForbiddenError(`Required role: ${roles.join(' or ')}`)
      );
    }

    next();
  };
}

/**
 * Admin only middleware
 */
export function adminOnly(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(new UnauthorizedError());
  }

  if (req.user.role !== 'admin') {
    return next(new ForbiddenError('Admin access required'));
  }

  next();
}

/**
 * Get user permissions
 */
export function getUserPermissions(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}
