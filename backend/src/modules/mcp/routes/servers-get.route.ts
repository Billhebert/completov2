import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMcpServersGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/servers/:id`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const server = await prisma.mCPServer.findFirst({
        where: {
          id: req.params.id,
          OR: [
            { companyId: req.companyId! },
            { isPublic: true },
          ],
        },
        include: {
          tools: true,
          resources: true,
          logs: {
            orderBy: { timestamp: 'desc' },
            take: 50,
          },
        },
      });
      res.json({ success: true, data: server });
    } catch (error) {
      next(error);
    }
  });
}
