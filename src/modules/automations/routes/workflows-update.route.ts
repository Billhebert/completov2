import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../../../core/middleware';
import { logger } from '../../../core/logger';

export function setupAutomationsWorkflowsUpdateRoute(app: Express, prisma: PrismaClient, baseUrl: string) {
  app.patch(`${baseUrl}/workflows/:id`, authenticate, async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { companyId, role } = (req as any).user!;
      const { id } = req.params;

      if (role !== 'company_admin' && role !== 'supervisor') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const workflow = await prisma.workflow.findFirst({
        where: { id, companyId }
      });

      if (!workflow) {
        return res.status(404).json({ error: 'Workflow not found' });
      }

      const { name, description, definition } = req.body;

      const updated = await prisma.workflow.update({
        where: { id },
        data: {
          name: name || workflow.name,
          description: description !== undefined ? description : workflow.description,
          definition: definition || workflow.definition,
          version: workflow.version + 1
        }
      });

      res.json(updated);

    } catch (error) {
      next(error);
    }
  });
}
