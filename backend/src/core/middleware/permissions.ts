// src/core/middleware/permissions.ts
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '../errors';

// Comprehensive permission system
export enum Permission {
  // Users
  USER_READ = 'user.read',
  USER_CREATE = 'user.create',
  USER_UPDATE = 'user.update',
  USER_DELETE = 'user.delete',

  // CRM - Contacts
  CONTACT_READ = 'contact.read',
  CONTACT_CREATE = 'contact.create',
  CONTACT_UPDATE = 'contact.update',
  CONTACT_DELETE = 'contact.delete',

  // CRM - Deals
  DEAL_READ = 'deal.read',
  DEAL_CREATE = 'deal.create',
  DEAL_UPDATE = 'deal.update',
  DEAL_DELETE = 'deal.delete',

  // ✅ CRM - Companies (NOVO)
  COMPANY_READ = 'company.read',
  COMPANY_CREATE = 'company.create',
  COMPANY_UPDATE = 'company.update',
  COMPANY_DELETE = 'company.delete',

  // Products
  PRODUCT_READ = 'product.read',
  PRODUCT_CREATE = 'product.create',
  PRODUCT_UPDATE = 'product.update',
  PRODUCT_DELETE = 'product.delete',

  // Invoices
  INVOICE_READ = 'invoice.read',
  INVOICE_CREATE = 'invoice.create',
  INVOICE_UPDATE = 'invoice.update',
  INVOICE_DELETE = 'invoice.delete',

  // Knowledge base
  KNOWLEDGE_READ = 'knowledge.read',
  KNOWLEDGE_CREATE = 'knowledge.create',
  KNOWLEDGE_UPDATE = 'knowledge.update',
  KNOWLEDGE_DELETE = 'knowledge.delete',

  // Chat
  CHAT_READ = 'chat.read',
  CHAT_SEND = 'chat.send',
  CHAT_MANAGE = 'chat.manage',

  // Analytics
  ANALYTICS_VIEW = 'analytics.view',

  // Settings
  SETTINGS_READ = 'settings.read',
  SETTINGS_MANAGE = 'settings.manage',

  // Files
  FILE_READ = 'file.read',
  FILE_UPLOAD = 'file.upload',
  FILE_DELETE = 'file.delete',
  FILE_SHARE = 'file.share',

  // API Keys
  APIKEY_READ = 'apikey.read',
  APIKEY_CREATE = 'apikey.create',
  APIKEY_REVOKE = 'apikey.revoke',

  // Webhooks
  WEBHOOK_READ = 'webhook.read',
  WEBHOOK_MANAGE = 'webhook.manage',
}

// Role to permissions mapping
export const rolePermissions: Record<string, Permission[]> = {
  admin: Object.values(Permission), // All permissions

  manager: [
    // Users
    Permission.USER_READ,
    Permission.USER_CREATE,
    Permission.USER_UPDATE,

    // CRM - Full
    Permission.CONTACT_READ,
    Permission.CONTACT_CREATE,
    Permission.CONTACT_UPDATE,
    Permission.CONTACT_DELETE,

    Permission.DEAL_READ,
    Permission.DEAL_CREATE,
    Permission.DEAL_UPDATE,
    Permission.DEAL_DELETE,

    // ✅ CRM - Companies
    Permission.COMPANY_READ,
    Permission.COMPANY_CREATE,
    Permission.COMPANY_UPDATE,
    Permission.COMPANY_DELETE,

    // Products
    Permission.PRODUCT_READ,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.PRODUCT_DELETE,

    // Invoices
    Permission.INVOICE_READ,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,

    // Knowledge base
    Permission.KNOWLEDGE_READ,
    Permission.KNOWLEDGE_CREATE,
    Permission.KNOWLEDGE_UPDATE,
    Permission.KNOWLEDGE_DELETE,

    // Chat
    Permission.CHAT_READ,
    Permission.CHAT_SEND,

    // Analytics
    Permission.ANALYTICS_VIEW,

    // Settings - Read only
    Permission.SETTINGS_READ,

    // Files
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
  ],

  viewer: [
    // Read-only access
    Permission.USER_READ,

    Permission.CONTACT_READ,
    Permission.DEAL_READ,

    // ✅ CRM - Companies (read-only)
    Permission.COMPANY_READ,

    Permission.PRODUCT_READ,
    Permission.INVOICE_READ,
    Permission.KNOWLEDGE_READ,
    Permission.CHAT_READ,
    Permission.ANALYTICS_VIEW,
    Permission.SETTINGS_READ,
    Permission.FILE_READ,
  ],
};

/**
 * Check if user has permission
 */
export function hasPermission(userRole: string, permission: Permission): boolean {
  const permissions = rolePermissions[userRole] || [];
  return permissions.includes(permission);
}

/**
 * Middleware to require specific permission
 */
export function requirePermission(permission: Permission) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ForbiddenError('Authentication required'));

    const ok = hasPermission(req.user.role, permission);
    if (!ok) return next(new ForbiddenError(`Permission required: ${permission}`));

    next();
  };
}

/**
 * Middleware to require ANY of the permissions
 */
export function requireAnyPermission(permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ForbiddenError('Authentication required'));

    const hasAny = permissions.some((perm) => hasPermission(req.user!.role, perm));
    if (!hasAny) {
      return next(
        new ForbiddenError(`Any of these permissions required: ${permissions.join(', ')}`)
      );
    }

    next();
  };
}

/**
 * Middleware to require ALL of the permissions
 */
export function requireAllPermissions(permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new ForbiddenError('Authentication required'));

    const hasAll = permissions.every((perm) => hasPermission(req.user!.role, perm));
    if (!hasAll) {
      return next(
        new ForbiddenError(`All of these permissions required: ${permissions.join(', ')}`)
      );
    }

    next();
  };
}
