import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsWorkflowsGetRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/workflows/:id`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = (req as any).user!;
      const { id } = req.params;

      const workflow = await prisma.workflow.findFirst({
        where: { id, companyId },
        include: {
          executions: {
            take: 10,
            orderBy: { startedAt: 'desc' }
          }
        }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      res.json(workflow);
    } catch (error) {
      next(error);
    }
  });
}
