import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupRBACRolesCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/roles`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const role = await prisma.role.create({
        data: { ...req.body, companyId: user.companyId },
      });
      res.status(201).json(role);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to create role' });
    }
  });
}
