import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsWorkflowsListRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.get(`${baseUrl}/workflows`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId } = (req as any).user!;
      const { status } = req.query;

      const where: any = { companyId };
      if (status) where.status = status;

      const workflows = await prisma.workflow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          version: true,
          createdAt: true,
          updatedAt: true,
          _count: { select: { executions: true } }
        }
      });

      res.json({ data: workflows });
    } catch (error) {
      next(error);
    }
  });
}
