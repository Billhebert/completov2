import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';
import { z } from 'zod';

const WorkflowSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  definition: z.object({
    nodes: z.array(z.any()),
    edges: z.array(z.any())
  })
});

export function setupAutomationsWorkflowsCreateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.post(`${baseUrl}/workflows`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, id: userId, role } = (req as any).user!;

      // Apenas admin/supervisor podem criar workflows
      if (role !== 'company_admin' && role !== 'supervisor') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const data = WorkflowSchema.parse(req.body);

      const workflow = await prisma.workflow.create({
        data: {
          companyId,
          name: data.name,
          description: data.description,
          definition: data.definition as any,
          createdBy: userId,
          status: 'DRAFT',
          version: 1
        }
      });

      logger.info({ workflowId: workflow.id, userId }, 'Workflow created');
      res.status(201).json(workflow);

    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.errors });
      }
      next(error);
    }
  });
}
