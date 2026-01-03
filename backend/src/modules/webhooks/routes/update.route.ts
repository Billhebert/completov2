import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupWebhooksUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.put(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const webhook = await prisma.webhook.updateMany({
        where: { id: req.params.id, companyId: user.companyId },
        data: req.body,
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to update webhook' });
    }
  });
}
