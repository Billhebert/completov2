import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupGatekeeperRulesRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/rules`, authenticate, async (req: Request, res: Response) => {
    try {
      res.json({ data: [] });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to list rules' });
    }
  });
}
