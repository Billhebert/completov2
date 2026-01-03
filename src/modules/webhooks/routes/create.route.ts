import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupWebhooksCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const webhook = await prisma.webhook.create({
        data: { ...req.body, companyId: user.companyId },
      });
      res.status(201).json(webhook);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create webhook' });
    }
  });
}
