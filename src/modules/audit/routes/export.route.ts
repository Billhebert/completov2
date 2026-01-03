import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getAuditService } from '../../../core/audit';

export function setupAuditExportRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const audit = getAuditService(prisma);

  app.get(`${baseUrl}/export`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
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
