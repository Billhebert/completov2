import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupOmnichannelConversationsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/conversations`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { contactId, channel, status, assignedToId } = req.body;

      if (!contactId) {
        return res.status(400).json({ error: 'contactId is required' });
      }

      const conversation = await prisma.conversation.create({
        data: {
          companyId: req.companyId!,
          contactId,
          channel: channel || 'whatsapp',
          status: status || 'open',
          assignedToId: assignedToId || req.user!.id,
        },
        include: {
          contact: { select: { id: true, name: true, email: true, phone: true } },
          assignedTo: { select: { id: true, name: true, email: true } },
        },
      });

      res.status(201).json(conversation);
    } catch (error) {
      next(error);
    }
  });
}
