import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { peopleGrowthService } from '../service';

export function setupPeopleGrowthGapsCloseRoute(app: Express, _prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/gaps/:id/close`, authenticate, tenantIsolation, async (req: Request, res: Response) => {
    try {
      const { id: userId } = (req as any).user;
      const { id } = req.params;

      await peopleGrowthService.closeGap(id, userId);

      res.json({ message: 'Gap closed successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Failed to close gap' });
    }
  });
}
