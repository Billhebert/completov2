import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';
import { workflowExecutor } from '../engine/executor';

export function setupAutomationsWorkflowsTestRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workflows/:id/test`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, id: userId } = (req as any).user!;
      const { id } = req.params;
      const { testData } = req.body;

      const workflow = await prisma.workflow.findFirst({
        where: { id, companyId }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      // Executar em background
      workflowExecutor.execute(workflow, {
        workflowId: workflow.id,
        companyId,
        userId,
        trigger: {
          event: 'test',
          data: testData || {}
        },
        variables: {}
      }).catch(err => {
        logger.error({ error: err }, 'Test execution failed');
      });

      res.json({ message: 'Test execution started' });

    } catch (error) {
      next(error);
    }
  });
}
