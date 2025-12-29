// src/core/audit/index.ts
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';
import { logger } from '../logger';

export interface AuditLogData {
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  metadata?: any;
}

export class AuditService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Log an audit entry
   */
  async log(
    companyId: string,
    userId: string,
    data: AuditLogData,
    req?: Request
  ): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          companyId,
          userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          oldValue: data.oldValue,
          newValue: data.newValue,
          metadata: {
            ...data.metadata,
            ipAddress: req?.ip,
            userAgent: req?.headers['user-agent'],
            path: req?.path,
            method: req?.method,
          },
        },
      });
    } catch (error) {
      logger.error({ error, data }, 'Failed to create audit log');
    }
  }

  /**
   * Get audit logs for an entity
   */
  async getEntityHistory(
    companyId: string,
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        companyId,
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get user activity
   */
  async getUserActivity(
    companyId: string,
    userId: string,
    startDate?: Date,
    endDate?: Date,
    limit = 100
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        companyId,
        userId,
        ...(startDate && { createdAt: { gte: startDate } }),
        ...(endDate && { createdAt: { lte: endDate } }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get all company audit logs
   */
  async getCompanyLogs(
    companyId: string,
    filters?: {
      action?: string;
      entityType?: string;
      userId?: string;
      startDate?: Date;
      endDate?: Date;
    },
    limit = 100
  ) {
    return this.prisma.auditLog.findMany({
      where: {
        companyId,
        ...(filters?.action && { action: filters.action }),
        ...(filters?.entityType && { entityType: filters.entityType }),
        ...(filters?.userId && { userId: filters.userId }),
        ...(filters?.startDate && { createdAt: { gte: filters.startDate } }),
        ...(filters?.endDate && { createdAt: { lte: filters.endDate } }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Compare changes
   */
  getChanges(oldValue: any, newValue: any): Record<string, { old: any; new: any }> {
    const changes: Record<string, { old: any; new: any }> = {};

    if (!oldValue || !newValue) return changes;

    const allKeys = new Set([...Object.keys(oldValue), ...Object.keys(newValue)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValue[key]) !== JSON.stringify(newValue[key])) {
        changes[key] = {
          old: oldValue[key],
          new: newValue[key],
        };
      }
    }

    return changes;
  }
}

// Singleton
let auditService: AuditService | null = null;

export function getAuditService(prisma?: PrismaClient): AuditService {
  if (!auditService && prisma) {
    auditService = new AuditService(prisma);
  }
  if (!auditService) {
    throw new Error('AuditService not initialized');
  }
  return auditService;
}

/**
 * Audit decorator for methods
 */
export function Audit(action: string, entityType: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const result = await originalMethod.apply(this, args);

      // Try to extract audit info from context
      const ctx = args[0];
      if (ctx?.companyId && ctx?.userId) {
        const audit = getAuditService(this.prisma);
        await audit.log(
          ctx.companyId,
          ctx.userId,
          {
            action,
            entityType,
            entityId: result?.id,
            newValue: result,
          },
          ctx.req
        );
      }

      return result;
    };

    return descriptor;
  };
}
