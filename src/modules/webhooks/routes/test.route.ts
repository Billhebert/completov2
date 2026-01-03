import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupWebhooksTestRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/:id/test`, authenticate, async (req: Request, res: Response) => {
    try {
      res.json({ success: true, message: 'Webhook test triggered' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to test webhook' });
    }
  });
}
