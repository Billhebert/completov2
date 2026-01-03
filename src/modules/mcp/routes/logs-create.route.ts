import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMcpLogsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/servers/:id/logs`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { level, message, metadata } = req.body;
      
      const log = await prisma.mCPServerLog.create({
        data: {
          serverId: req.params.id,
          level: level || 'info',
          message,
          metadata,
        },
      });
      res.json({ success: true, data: log });
    } catch (error) {
      next(error);
    }
  });
}
