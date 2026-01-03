import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupGatekeeperCheckRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/check`, authenticate, async (req: Request, res: Response) => {
    try {
      res.json({ allowed: true });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to check permission' });
    }
  });
}
