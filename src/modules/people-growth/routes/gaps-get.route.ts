import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';

const prisma = new PrismaClient();

export function setupPeopleGrowthGapsGetRoute(app: Express, _prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/gaps/:id`, authenticate, tenantIsolation, async (req: Request, res: Response) => {
    try {
      const { id: userId, role } = (req as any).user;
      const { id } = req.params;

      const gap = await prisma.employeeGap.findUnique({
        where: { id },
        include: {
          employee: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!gap) {
        return res.status(404).json({ error: 'Gap not found' });
      }

      if (role !== 'company_admin' && role !== 'supervisor' && gap.employeeId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      res.json(gap);
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to fetch gap' });
    }
  });
}
