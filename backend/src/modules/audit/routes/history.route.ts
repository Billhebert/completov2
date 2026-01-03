import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { getAuditService } from '../../../core/audit';

export function setupAuditHistoryRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  const audit = getAuditService(prisma);

  app.get(`${baseUrl}/history/:entityType/:entityId`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
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
}
