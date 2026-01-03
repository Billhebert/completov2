import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupChatChannelsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/channels`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channels = await prisma.channel.findMany({
        where: { companyId: req.companyId! },
        include: { _count: { select: { members: true } } },
      });
      res.json({ success: true, data: channels });
    } catch (error) {
      next(error);
    }
  });
}
