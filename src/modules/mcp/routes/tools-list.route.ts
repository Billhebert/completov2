import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMcpToolsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/servers/:id/tools`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tools = await prisma.mCPTool.findMany({
        where: { serverId: req.params.id },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: tools });
    } catch (error) {
      next(error);
    }
  });
}
