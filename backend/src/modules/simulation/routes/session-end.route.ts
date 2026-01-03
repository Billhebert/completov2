import { Express, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, tenantIsolation } from '../../../core/middleware';
import { logger } from '../../../core/logger';
import { evaluateSession } from '../services/evaluation.service';
import { createLearningZettel } from '../services/learning.service';
import { peopleGrowthService } from '../../people-growth/service';

export function setupSessionEndRoute(
  app: Express,
  prisma: PrismaClient,
  baseUrl: string
) {
  app.post(
    `${baseUrl}/:id/end`,
    authenticate,
    tenantIsolation,
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const { userId } = req.user!;
        const { id } = req.params;

        const session = await prisma.simulationSession.findFirst({
          where: { id, userId },
          include: { scenario: true }
        });

        if (!session) {
          return res.status(404).json({ error: 'Session not found' });
        }

        // Avaliar com LLM
        const evaluation = await evaluateSession(session.transcript as any[], session.scenario.rubric);

        // Atualizar sessão
        await prisma.simulationSession.update({
          where: { id },
          data: {
            finishedAt: new Date(),
            evaluation: evaluation as any,
            score: evaluation.score,
            feedback: evaluation.feedback
          }
        });

        // Criar zettel de learning
        await createLearningZettel(session, evaluation, prisma);

        // Detectar gaps de desenvolvimento
        await peopleGrowthService.detectGapsFromSimulation(id, evaluation);

        res.json(evaluation);
      } catch (error: any) {
        logger.error({ error }, 'Error ending simulation');
        next(error);
      }
    }
  );
}
