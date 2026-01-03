import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';
import crypto from 'crypto';

export function setupApikeysCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const key = crypto.randomBytes(32).toString('hex');
      const apiKey = await prisma.apiKey.create({
        data: {
          key,
          name: req.body.name,
          companyId: user.companyId,
          createdBy: user.id,
        },
      });
      res.status(201).json(apiKey);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create API key' });
    }
  });
}
