import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsExecutionLogsRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/executions/:id/logs`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = (req as any).user!;
      const { id } = req.params;

      const execution = await prisma.workflowExecution.findFirst({
        where: {
          id,
          workflow: { companyId }
        },
        include: {
          workflow: { select: { name: true } }
        }
      });

      if (!execution) {
        return res.status(404).json({ error: 'Execution not found' });
      }

      res.json(execution);

    } catch (error) {
      next(error);
    }
  });
}
