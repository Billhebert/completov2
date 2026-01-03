import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupFeedbackCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      res.status(201).json({ success: true, message: 'Feedback created' });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create feedback' });
    }
  });
}
