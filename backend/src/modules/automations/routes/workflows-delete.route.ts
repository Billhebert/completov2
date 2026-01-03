import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsWorkflowsDeleteRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.delete(`${baseUrl}/workflows/:id`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, role } = (req as any).user!;
      const { id } = req.params;

      if (role !== 'company_admin') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const workflow = await prisma.workflow.findFirst({
        where: { id, companyId }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      await prisma.workflow.delete({ where: { id } });

      logger.info({ workflowId: id }, 'Workflow deleted');
      res.json({ message: 'Workflow deleted' });

    } catch (error) {
      next(error);
    }
  });
}
