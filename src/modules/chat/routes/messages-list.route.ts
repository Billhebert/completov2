import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupChatMessagesListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/channels/:channelId/messages`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const messages = await prisma.message.findMany({
        where: {
          channelId: req.params.channelId,
          companyId: req.companyId!,
          deletedAt: null,
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(req.query.limit as string) || 100,
        include: {
          author: { select: { id: true, name: true, email: true } },
          reactions: {
            include: { user: { select: { id: true, name: true } } },
          },
        },
      });
      res.json({ success: true, data: messages });
    } catch (error) {
      next(error);
    }
  });
}
