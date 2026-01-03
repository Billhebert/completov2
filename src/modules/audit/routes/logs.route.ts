import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getAuditService } from '../../../core/audit';

export function setupAuditLogsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const audit = getAuditService(prisma);

  app.get(`${baseUrl}/logs`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
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
}
