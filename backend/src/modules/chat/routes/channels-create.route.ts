import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

export function setupChatChannelsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/channels`, authenticate, tenantIsolation, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await prisma.channel.create({
        data: {
          companyId: req.companyId!,
          name: req.body.name,
          description: req.body.description,
          type: req.body.type || 'public',
          createdBy: req.user!.id,
        },
      });
      res.status(201).json({ success: true, data: channel });
    } catch (error) {
      next(error);
    }
  });
}
