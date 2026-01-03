import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupWebhooksDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(`${baseUrl}/:id`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      await prisma.webhook.deleteMany({
        where: { id: req.params.id, companyId: user.companyId },
      });
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to delete webhook' });
    }
  });
}
