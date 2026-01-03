import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupAuditStatsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/stats`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
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
}
