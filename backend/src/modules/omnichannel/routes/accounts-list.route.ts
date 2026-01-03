import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupOmnichannelAccountsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/whatsapp/accounts`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const accounts = await prisma.whatsAppAccount.findMany({
        where: { companyId: req.companyId! },
        select: {
          id: true,
          name: true,
          instanceName: true,
          status: true,
          lastConnectedAt: true,
          createdAt: true,
        },
      });
      res.json({ success: true, data: accounts });
    } catch (error) {
      next(error);
    }
  });
}
