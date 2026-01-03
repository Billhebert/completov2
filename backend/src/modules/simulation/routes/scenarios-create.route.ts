import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation, validateBody } from '../../../core/middleware';
import { logger } from '../../../core/logger';
import { z } from 'zod';

const createScenarioSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.string().min(1),
  persona: z.record(z.any()),
  rubric: z.record(z.any()).optional(),
  difficulty: z.number().default(3),
  estimatedDuration: z.number().default(15)
});

export function setupScenariosCreateRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/scenarios`,
    authenticate,
    tenantIsolation,
    validateBody(createScenarioSchema),
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { companyId, role } = req.user!;

        if (role !== 'company_admin' && role !== 'supervisor') {
          return res.status(403).json({ error: 'Forbidden' });
        }

        const { title, description, type, persona, rubric, difficulty, estimatedDuration } = req.body;

        const scenario = await prisma.simulationScenario.create({
          data: {
            companyId,
            title,
            description,
            type,
            persona,
            rubric,
            difficulty: difficulty || 3,
            estimatedDuration: estimatedDuration || 15
          }
        });

        res.status(201).json(scenario);
      } catch (error: any) {
        logger.error({ error }, 'Error creating scenario');
        next(error);
      }
    }
  );
}
