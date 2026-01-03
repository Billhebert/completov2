import { Express, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { peopleGrowthService } from '../service';

export function setupPeopleGrowthGapsLearningPathsRoute(app: Express, _prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/gaps/:id/learning-paths`, authenticate, tenantIsolation, async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const paths = await peopleGrowthService.suggestLearningPath(id);

      res.json({ data: paths });
    } catch (error: any) {
      res.status(500).json({ error: 'Failed to suggest learning paths' });
    }
  });
}
