import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupOmnichannelConversationsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/conversations`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, channel, contactId, page = '1', pageSize = '20' } = req.query;

      const where: any = { companyId: req.companyId! };
      if (status) where.status = status;
      if (channel) where.channel = channel;
      if (contactId) where.contactId = contactId;

      const skip = (parseInt(page as string) - 1) * parseInt(pageSize as string);
      const take = parseInt(pageSize as string);

      const [conversations, total] = await Promise.all([
        prisma.conversation.findMany({
          where,
          skip,
          take,
          include: {
            contact: { select: { id: true, name: true, email: true, phone: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            _count: { select: { messages: true } },
          },
          orderBy: { updatedAt: 'desc' },
        }),
        prisma.conversation.count({ where }),
      ]);

      res.json({
        data: conversations,
        total,
        page: parseInt(page as string),
        pageSize: take,
        totalPages: Math.ceil(total / take),
      });
    } catch (error) {
      next(error);
    }
  });
}
