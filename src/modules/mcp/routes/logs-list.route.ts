import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMcpLogsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/servers/:id/logs`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { level, limit = 100 } = req.query;
      const where: any = { serverId: req.params.id };
      if (level) where.level = level;

      const logs = await prisma.mCPServerLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: parseInt(limit as string),
      });
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  });
}
