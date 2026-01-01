// src/modules/audit/index.ts
import { ModuleDefinition } from '../../core/types';
import { Express } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../core/middleware';
import { getAuditService } from '../../core/audit';

function setupRoutes(app: Express, prisma: PrismaClient) {
  const base = '/api/v1/audit';
  const audit = getAuditService(prisma);

  // Get company audit logs
  app.get(`${base}/logs`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { action, entityType, userId, startDate, endDate, limit } = req.query;

      const logs = await audit.getCompanyLogs(
        req.companyId!,
        {
          action: action as string,
          entityType: entityType as string,
          userId: userId as string,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
        },
        limit ? parseInt(limit as string) : 100
      );

      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  });

  // Get entity history
  app.get(`${base}/history/:entityType/:entityId`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { entityType, entityId } = req.params;
      const { limit } = req.query;

      const history = await audit.getEntityHistory(
        req.companyId!,
        entityType,
        entityId,
        limit ? parseInt(limit as string) : 50
      );

      res.json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  });

  // Get user activity
  app.get(`${base}/activity/:userId`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { userId } = req.params;
      const { startDate, endDate, limit } = req.query;

      const activity = await audit.getUserActivity(
        req.companyId!,
        userId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        limit ? parseInt(limit as string) : 100
      );

      res.json({ success: true, data: activity });
    } catch (error) {
      next(error);
    }
  });

  // Get audit stats
  app.get(`${base}/stats`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const [total, byAction, byEntity, topUsers] = await Promise.all([
        prisma.auditLog.count({ where: { companyId: req.companyId! } }),
        prisma.auditLog.groupBy({
          by: ['action'],
          where: { companyId: req.companyId! },
          _count: { id: true },
        }),
        prisma.auditLog.groupBy({
          by: ['entityType'],
          where: { companyId: req.companyId! },
          _count: { id: true },
        }),
        prisma.auditLog.groupBy({
          by: ['userId'],
          where: { companyId: req.companyId! },
          _count: { id: true },
          orderBy: { _count: { id: 'desc' } },
          take: 10,
        }),
      ]);

      res.json({
        success: true,
        data: {
          total,
          byAction,
          byEntity,
          topUsers,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Export audit logs (CSV)
  app.get(`${base}/export`, authenticate, tenantIsolation, async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;

      const logs = await audit.getCompanyLogs(req.companyId!, {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
      }, 10000);

      const csv = [
        'Timestamp,User,Action,Entity Type,Entity ID,IP Address',
        ...logs.map((log) =>
          [
            log.createdAt.toISOString(),
            log.user.email,
            log.action,
            log.entityType,
            log.entityId || '',
            (log.metadata as any)?.ipAddress || '',
          ].join(',')
        ),
      ].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="audit-log.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  });
}

export const auditModule: ModuleDefinition = {
  name: 'audit',
  version: '1.0.0',
  provides: ['audit', 'compliance'],
  routes: (ctx) => setupRoutes(ctx.app, ctx.prisma),
};
