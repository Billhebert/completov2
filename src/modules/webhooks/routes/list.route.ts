import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupWebhooksListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const webhooks = await prisma.webhook.findMany({
        where: { companyId: user.companyId },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ data: webhooks });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to list webhooks' });
    }
  });
}
