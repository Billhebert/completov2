// src/core/types/index.ts
import { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import { EventBus } from '../event-bus';
import { Logger } from '../logger';
import { Env } from '../config/env';

// ============================================
// MODULE SYSTEM TYPES
// ============================================

export interface ModuleContext {
  app: Express;
  io?: SocketIOServer;
  prisma: PrismaClient;
  eventBus: EventBus;
  logger: Logger;
  config: Env;
}

export interface ModuleDefinition {
  name: string;
  version: string;
  enabled?: boolean;
  dependsOn?: string[];
  provides?: string[];
  routes?: (ctx: ModuleContext) => void | Promise<void>;
  sockets?: (ctx: ModuleContext) => void | Promise<void>;
  workers?: (ctx: ModuleContext) => void | Promise<void>;
  cron?: (ctx: ModuleContext) => void | Promise<void>;
  permissions?: (ctx: ModuleContext) => void | Promise<void>;
  onEnable?: (ctx: ModuleContext) => Promise<void> | void;
  onDisable?: (ctx: ModuleContext) => Promise<void> | void;
}

// ============================================
// AUTH & USER TYPES
// ============================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: string;
  companyId: string;
}

export interface JWTPayload {
  userId: string;
  companyId: string;
  role: string;
  email: string;
}

// ============================================
// REQUEST CONTEXT
// ============================================

export interface RequestContext {
  user: AuthenticatedUser;
  companyId: string;
  traceId: string;
  startTime: number;
}

// ============================================
// COMMON TYPES
// ============================================

export interface PaginationParams {
  limit?: number;
  cursor?: string;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total?: number;
    limit: number;
    cursor?: string;
    hasMore: boolean;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
    traceId?: string;
  };
}

// ============================================
// EVENT TYPES
// ============================================

export interface BaseEvent {
  type: string;
  version: string;
  timestamp: Date;
  companyId: string;
  userId?: string;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

// ============================================
// RBAC TYPES
// ============================================

export enum Permission {
  // User Management
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // Chat
  CHAT_CREATE = 'chat:create',
  CHAT_READ = 'chat:read',
  CHAT_UPDATE = 'chat:update',
  CHAT_DELETE = 'chat:delete',
  
  // CRM
  CONTACT_CREATE = 'contact:create',
  CONTACT_READ = 'contact:read',
  CONTACT_UPDATE = 'contact:update',
  CONTACT_DELETE = 'contact:delete',
  
  DEAL_CREATE = 'deal:create',
  DEAL_READ = 'deal:read',
  DEAL_UPDATE = 'deal:update',
  DEAL_DELETE = 'deal:delete',
  
  // ERP
  PRODUCT_CREATE = 'product:create',
  PRODUCT_READ = 'product:read',
  PRODUCT_UPDATE = 'product:update',
  PRODUCT_DELETE = 'product:delete',
  
  INVOICE_CREATE = 'invoice:create',
  INVOICE_READ = 'invoice:read',
  INVOICE_UPDATE = 'invoice:update',
  INVOICE_DELETE = 'invoice:delete',
  
  // Knowledge
  KNOWLEDGE_CREATE = 'knowledge:create',
  KNOWLEDGE_READ = 'knowledge:read',
  KNOWLEDGE_UPDATE = 'knowledge:update',
  KNOWLEDGE_DELETE = 'knowledge:delete',
  
  // Admin
  COMPANY_MANAGE = 'company:manage',
  SETTINGS_MANAGE = 'settings:manage',
  INTEGRATIONS_MANAGE = 'integrations:manage',
}

export interface RolePermissions {
  role: string;
  permissions: Permission[];
}
