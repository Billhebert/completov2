import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { z } from 'zod';

const sendMessageSchema = z.object({
  channelId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().min(1),
});

export function setupChatMessagesSendRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/messages`, authenticate, tenantIsolation, validateBody(sendMessageSchema), async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await prisma.message.create({
        data: {
          companyId: req.companyId!,
          channelId: req.body.channelId,
          authorId: req.user!.id,
          content: req.body.content,
          status: 'sent',
        },
        include: { author: { select: { id: true, name: true, email: true } } },
      });
      res.status(201).json({ success: true, data: message });
    } catch (error) {
      next(error);
    }
  });
}
