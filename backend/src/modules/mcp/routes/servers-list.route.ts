import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupMcpServersListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/servers`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const servers = await prisma.mCPServer.findMany({
        where: {
          OR: [
            { companyId: req.companyId! },
            { isPublic: true },
          ],
          isActive: true,
        },
        include: {
          _count: {
            select: {
              tools: true,
              resources: true,
            },
          },
        },
        orderBy: { name: 'asc' },
      });
      res.json({ success: true, data: servers });
    } catch (error) {
      next(error);
    }
  });
}
