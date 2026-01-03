import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupConnectionsListRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.get(
    `${baseUrl}/connections`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const connections = await prisma.integrationConnection.findMany({
          where: { companyId: req.companyId! },
          select: {
            id: true,
            provider: true,
            status: true,
            lastSyncAt: true,
            createdAt: true,
          },
        });
        res.json({ success: true, data: connections });
      } catch (error) {
        next(error);
      }
    }
  );
}
