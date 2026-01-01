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
  
  // CRM
  CONTACT_READ = 'contact.read',
  CONTACT_CREATE = 'contact.create',
  CONTACT_UPDATE = 'contact.update',
  CONTACT_DELETE = 'contact.delete',
  
  DEAL_READ = 'deal.read',
  DEAL_CREATE = 'deal.create',
  DEAL_UPDATE = 'deal.update',
  DEAL_DELETE = 'deal.delete',
  
  // ERP
  PRODUCT_READ = 'product.read',
  PRODUCT_CREATE = 'product.create',
  PRODUCT_UPDATE = 'product.update',
  PRODUCT_DELETE = 'product.delete',
  
  INVOICE_READ = 'invoice.read',
  INVOICE_CREATE = 'invoice.create',
  INVOICE_UPDATE = 'invoice.update',
  INVOICE_DELETE = 'invoice.delete',
  
  // Knowledge
  KNOWLEDGE_READ = 'knowledge.read',
  KNOWLEDGE_CREATE = 'knowledge.create',
  KNOWLEDGE_UPDATE = 'knowledge.update',
  KNOWLEDGE_DELETE = 'knowledge.delete',
  
  // Chat
  CHAT_READ = 'chat.read',
  CHAT_SEND = 'chat.send',
  CHAT_MODERATE = 'chat.moderate',
  
  // Analytics
  ANALYTICS_VIEW = 'analytics.view',
  ANALYTICS_EXPORT = 'analytics.export',
  
  // Settings
  SETTINGS_READ = 'settings.read',
  SETTINGS_UPDATE = 'settings.update',
  
  // Integrations
  INTEGRATION_READ = 'integration.read',
  INTEGRATION_MANAGE = 'integration.manage',
  
  // Audit
  AUDIT_READ = 'audit.read',
  
  // Files
  FILE_READ = 'file.read',
  FILE_UPLOAD = 'file.upload',
  FILE_DELETE = 'file.delete',
  
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
    
    // ERP - Full
    Permission.PRODUCT_READ,
    Permission.PRODUCT_CREATE,
    Permission.PRODUCT_UPDATE,
    Permission.INVOICE_READ,
    Permission.INVOICE_CREATE,
    Permission.INVOICE_UPDATE,
    
    // Knowledge
    Permission.KNOWLEDGE_READ,
    Permission.KNOWLEDGE_CREATE,
    Permission.KNOWLEDGE_UPDATE,
    
    // Chat
    Permission.CHAT_READ,
    Permission.CHAT_SEND,
    Permission.CHAT_MODERATE,
    
    // Analytics
    Permission.ANALYTICS_VIEW,
    Permission.ANALYTICS_EXPORT,
    
    // Settings
    Permission.SETTINGS_READ,
    
    // Integrations
    Permission.INTEGRATION_READ,
    
    // Files
    Permission.FILE_READ,
    Permission.FILE_UPLOAD,
    Permission.FILE_DELETE,
    
    // Audit
    Permission.AUDIT_READ,
  ],
  
  agent: [
    // Users - Read only
    Permission.USER_READ,
    
    // CRM - CRUD
    Permission.CONTACT_READ,
    Permission.CONTACT_CREATE,
    Permission.CONTACT_UPDATE,
    Permission.DEAL_READ,
    Permission.DEAL_CREATE,
    Permission.DEAL_UPDATE,
    
    // ERP - Read + Create
    Permission.PRODUCT_READ,
    Permission.INVOICE_READ,
    Permission.INVOICE_CREATE,
    
    // Knowledge
    Permission.KNOWLEDGE_READ,
    Permission.KNOWLEDGE_CREATE,
    
    // Chat
    Permission.CHAT_READ,
    Permission.CHAT_SEND,
    
    // Analytics - View only
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
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!hasPermission(req.user.role, permission)) {
      return next(
        new ForbiddenError(`Permission '${permission}' required`)
      );
    }

    next();
  };
}

/**
 * Middleware to require ANY of the permissions
 */
export function requireAnyPermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    const hasAny = permissions.some((perm) =>
      hasPermission(req.user!.role, perm)
    );

    if (!hasAny) {
      return next(
        new ForbiddenError(`One of these permissions required: ${permissions.join(', ')}`)
      );
    }

    next();
  };
}

/**
 * Middleware to require ALL permissions
 */
export function requireAllPermissions(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    const hasAll = permissions.every((perm) =>
      hasPermission(req.user!.role, perm)
    );

    if (!hasAll) {
      return next(
        new ForbiddenError(`All of these permissions required: ${permissions.join(', ')}`)
      );
    }

    next();
  };
}
