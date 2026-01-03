import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware/auth';

export function setupRBACRolesListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/roles`, authenticate, async (req: Request, res: Response) => {
    try {
      const user = (req as any).user;
      const roles = await prisma.role.findMany({
        where: { companyId: user.companyId },
      });
      res.json({ data: roles });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to list roles' });
    }
  });
}
