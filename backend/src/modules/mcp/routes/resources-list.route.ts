import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMcpResourcesListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/servers/:id/resources`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const resources = await prisma.mCPResource.findMany({
        where: { serverId: req.params.id },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: resources });
    } catch (error) {
      next(error);
    }
  });
}
