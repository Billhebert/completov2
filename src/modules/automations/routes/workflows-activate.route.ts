import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsWorkflowsActivateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workflows/:id/activate`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, role } = (req as any).user!;
      const { id } = req.params;

      if (role !== 'company_admin' && role !== 'supervisor') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const workflow = await prisma.workflow.update({
        where: { id, companyId },
        data: { status: 'ACTIVE' }
      });

      logger.info({ workflowId: id }, 'Workflow activated');
      res.json(workflow);

    } catch (error) {
      next(error);
    }
  });
}
