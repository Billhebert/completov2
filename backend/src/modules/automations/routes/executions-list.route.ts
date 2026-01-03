import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsExecutionsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/executions`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = (req as any).user!;
      const { workflowId, status, limit = '50', offset = '0' } = req.query;

      const where: any = { workflow: { companyId } };
      if (workflowId) where.workflowId = workflowId;
      if (status) where.status = status;

      const executions = await prisma.workflowExecution.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
        include: {
          workflow: { select: { name: true } }
        }
      });

      const total = await prisma.workflowExecution.count({ where });

      res.json({
        data: executions,
        pagination: {
          total,
          limit: parseInt(limit as string),
          offset: parseInt(offset as string)
        }
      });

    } catch (error) {
      next(error);
    }
  });
}
